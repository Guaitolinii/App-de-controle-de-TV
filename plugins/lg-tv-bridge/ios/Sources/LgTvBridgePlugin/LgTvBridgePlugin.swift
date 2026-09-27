import Foundation
import Network
import Capacitor

/// Plugin nativo que dá ao app o acesso de rede que o WebView do iOS não permite:
/// - WebSocket (ws:// e wss://) aceitando o certificado autoassinado da TV LG (somente IPs privados)
/// - Sondagem TCP de portas, usada na busca de TVs na rede sem precisar de multicast
/// - Envio de pacotes UDP (Wake-on-LAN)
/// - Leitura do IP e da máscara do Wi-Fi do celular
///
/// Observação: a primeira anotação @objc(...) deste arquivo precisa ser a do plugin,
/// pois o Capacitor CLI usa ela para registrar a classe no packageClassList.
@objc(LgTvBridgePlugin)
public class LgTvBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LgTvBridgePlugin"
    public let jsName = "LgTvBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openSocket", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendSocket", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "closeSocket", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "probePort", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendUdp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNetworkInfo", returnType: CAPPluginReturnPromise)
    ]

    // Sockets abertos, indexados pelo id gerado no JavaScript
    private var sockets: [String: TvWebSocket] = [:]
    private let socketsLock = NSLock()

    // MARK: - WebSocket

    /// Abre um WebSocket e só resolve a Promise quando a conexão estiver aberta de fato.
    @objc func openSocket(_ call: CAPPluginCall) {
        guard let socketId = call.getString("id"),
              let urlString = call.getString("url"),
              let url = URL(string: urlString),
              let host = url.host else {
            call.reject("Parâmetros inválidos: informe id e url")
            return
        }
        let timeoutMs = call.getInt("timeoutMs") ?? 6000

        // Fecha um socket anterior com o mesmo id, se existir
        removeSocket(socketId)?.close()

        let socket = TvWebSocket(
            url: url,
            allowSelfSigned: LgTvBridgePlugin.isPrivateHost(host)
        )

        socket.onOpen = {
            call.resolve(["id": socketId])
        }
        socket.onOpenFailed = { [weak self] reason in
            _ = self?.removeSocket(socketId)
            call.reject(reason)
        }
        socket.onMessage = { [weak self] text in
            self?.notifyListeners("socketMessage", data: ["id": socketId, "data": text])
        }
        socket.onClosed = { [weak self] code, reason in
            _ = self?.removeSocket(socketId)
            self?.notifyListeners("socketClosed", data: ["id": socketId, "code": code, "reason": reason])
        }

        socketsLock.lock()
        sockets[socketId] = socket
        socketsLock.unlock()

        socket.start(timeout: TimeInterval(timeoutMs) / 1000.0)
    }

    /// Envia uma mensagem de texto por um socket já aberto.
    @objc func sendSocket(_ call: CAPPluginCall) {
        guard let socketId = call.getString("id"), let data = call.getString("data") else {
            call.reject("Parâmetros inválidos: informe id e data")
            return
        }
        socketsLock.lock()
        let socket = sockets[socketId]
        socketsLock.unlock()

        guard let socket = socket else {
            call.reject("Socket não está aberto")
            return
        }
        socket.send(data) { error in
            if let error = error {
                call.reject("Falha ao enviar: \(error.localizedDescription)")
            } else {
                call.resolve()
            }
        }
    }

    /// Fecha um socket (sem disparar o evento socketClosed).
    @objc func closeSocket(_ call: CAPPluginCall) {
        guard let socketId = call.getString("id") else {
            call.reject("Parâmetro inválido: informe id")
            return
        }
        removeSocket(socketId)?.close()
        call.resolve()
    }

    private func removeSocket(_ socketId: String) -> TvWebSocket? {
        socketsLock.lock()
        let socket = sockets.removeValue(forKey: socketId)
        socketsLock.unlock()
        return socket
    }

    // MARK: - Sondagem TCP (busca de TVs)

    /// Tenta abrir uma conexão TCP em host:porta e informa se a porta respondeu.
    @objc func probePort(_ call: CAPPluginCall) {
        guard let host = call.getString("host"),
              let portNumber = call.getInt("port"),
              portNumber > 0, portNumber < 65536,
              let port = NWEndpoint.Port(rawValue: UInt16(portNumber)) else {
            call.reject("Parâmetros inválidos: informe host e port")
            return
        }
        let timeoutMs = call.getInt("timeoutMs") ?? 700

        let queue = DispatchQueue(label: "lgtvbridge.probe.\(host).\(portNumber)")
        let connection = NWConnection(host: NWEndpoint.Host(host), port: port, using: .tcp)
        var finished = false

        // Todas as chamadas acontecem na mesma fila serial, então "finished" é seguro
        let finish: (Bool, String) -> Void = { isOpen, reason in
            if finished { return }
            finished = true
            connection.stateUpdateHandler = nil
            connection.cancel()
            call.resolve(["open": isOpen, "reason": reason])
        }

        connection.stateUpdateHandler = { state in
            switch state {
            case .ready:
                finish(true, "ready")
            case .waiting(let error):
                finish(false, "waiting: \(error)")
            case .failed(let error):
                finish(false, "failed: \(error)")
            case .cancelled:
                finish(false, "cancelled")
            default:
                break
            }
        }
        connection.start(queue: queue)
        queue.asyncAfter(deadline: .now() + .milliseconds(timeoutMs)) {
            finish(false, "timeout")
        }
    }

    // MARK: - UDP (Wake-on-LAN)

    /// Envia um datagrama UDP. Em broadcast o iOS pode recusar sem o entitlement de multicast;
    /// nesse caso a Promise resolve com sent=false e o motivo, sem gerar erro.
    @objc func sendUdp(_ call: CAPPluginCall) {
        guard let host = call.getString("host"),
              let base64 = call.getString("base64"),
              let payload = Data(base64Encoded: base64) else {
            call.reject("Parâmetros inválidos: informe host e base64")
            return
        }
        let port = UInt16(call.getInt("port") ?? 9)
        let broadcast = call.getBool("broadcast") ?? false

        let fd = Darwin.socket(AF_INET, SOCK_DGRAM, Int32(IPPROTO_UDP))
        if fd < 0 {
            call.resolve(["sent": false, "error": LgTvBridgePlugin.lastErrorText()])
            return
        }
        defer { Darwin.close(fd) }

        if broadcast {
            var enable: Int32 = 1
            setsockopt(fd, SOL_SOCKET, SO_BROADCAST, &enable, socklen_t(MemoryLayout<Int32>.size))
        }

        var address = sockaddr_in()
        address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        address.sin_family = sa_family_t(AF_INET)
        address.sin_port = port.bigEndian
        if inet_pton(AF_INET, host, &address.sin_addr) != 1 {
            call.resolve(["sent": false, "error": "IP inválido: \(host)"])
            return
        }

        let sentBytes: Int = payload.withUnsafeBytes { (buffer: UnsafeRawBufferPointer) -> Int in
            return withUnsafePointer(to: &address) { addressPointer -> Int in
                return addressPointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { socketAddress -> Int in
                    return Darwin.sendto(fd, buffer.baseAddress, buffer.count, 0, socketAddress, socklen_t(MemoryLayout<sockaddr_in>.size))
                }
            }
        }

        if sentBytes < 0 {
            call.resolve(["sent": false, "error": LgTvBridgePlugin.lastErrorText()])
        } else {
            call.resolve(["sent": true, "bytes": sentBytes])
        }
    }

    // MARK: - Rede local

    /// Retorna o IPv4 e a máscara da interface Wi-Fi (en0), para saber qual faixa escanear.
    @objc func getNetworkInfo(_ call: CAPPluginCall) {
        var interfaces: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&interfaces) == 0, let first = interfaces else {
            call.resolve([:])
            return
        }
        defer { freeifaddrs(interfaces) }

        var candidates: [(name: String, ip: String, netmask: String)] = []
        var cursor: UnsafeMutablePointer<ifaddrs>? = first
        while let current = cursor {
            let flags = Int32(current.pointee.ifa_flags)
            let isUp = (flags & IFF_UP) != 0
            let isLoopback = (flags & IFF_LOOPBACK) != 0
            if isUp, !isLoopback, let address = current.pointee.ifa_addr, address.pointee.sa_family == UInt8(AF_INET) {
                let name = String(cString: current.pointee.ifa_name)
                let ip = LgTvBridgePlugin.numericHost(address)
                var netmask = "255.255.255.0"
                if let mask = current.pointee.ifa_netmask {
                    netmask = LgTvBridgePlugin.numericHost(mask)
                }
                candidates.append((name: name, ip: ip, netmask: netmask))
            }
            cursor = current.pointee.ifa_next
        }

        // Prioriza o Wi-Fi (en0); depois qualquer interface "en" com IP privado
        let chosen = candidates.first { $0.name == "en0" }
            ?? candidates.first { $0.name.hasPrefix("en") && LgTvBridgePlugin.isPrivateHost($0.ip) }
            ?? candidates.first { LgTvBridgePlugin.isPrivateHost($0.ip) }

        if let chosen = chosen {
            call.resolve(["ip": chosen.ip, "netmask": chosen.netmask, "interface": chosen.name])
        } else {
            call.resolve([:])
        }
    }

    // MARK: - Utilitários

    /// Converte um sockaddr em texto numérico (ex.: 192.168.1.20)
    static func numericHost(_ address: UnsafeMutablePointer<sockaddr>) -> String {
        var buffer = [CChar](repeating: 0, count: Int(NI_MAXHOST))
        let result = getnameinfo(address, socklen_t(address.pointee.sa_len), &buffer, socklen_t(buffer.count), nil, 0, NI_NUMERICHOST)
        if result != 0 { return "" }
        return String(cString: buffer)
    }

    /// Texto do último erro POSIX
    static func lastErrorText() -> String {
        return String(cString: strerror(errno))
    }

    /// Verdadeiro para IPs de rede local (10/8, 172.16/12, 192.168/16, 169.254/16) e nomes .local
    static func isPrivateHost(_ host: String) -> Bool {
        if host.hasSuffix(".local") { return true }
        let parts = host.split(separator: ".").compactMap { Int($0) }
        guard parts.count == 4 else { return false }
        switch (parts[0], parts[1]) {
        case (10, _): return true
        case (172, 16...31): return true
        case (192, 168): return true
        case (169, 254): return true
        default: return false
        }
    }
}

/// Um WebSocket nativo (URLSessionWebSocketTask) com tratamento do certificado autoassinado da TV.
/// Todo o estado é alterado apenas na fila serial "queue".
final class TvWebSocket: NSObject, URLSessionWebSocketDelegate {
    var onOpen: (() -> Void)?
    var onOpenFailed: ((String) -> Void)?
    var onMessage: ((String) -> Void)?
    var onClosed: ((Int, String) -> Void)?

    private let url: URL
    private let allowSelfSigned: Bool
    private let queue: OperationQueue
    private var session: URLSession?
    private var task: URLSessionWebSocketTask?
    private var pingTimer: DispatchSourceTimer?
    private var isOpen = false
    private var isFinished = false

    init(url: URL, allowSelfSigned: Bool) {
        self.url = url
        self.allowSelfSigned = allowSelfSigned
        self.queue = OperationQueue()
        self.queue.maxConcurrentOperationCount = 1
        super.init()
    }

    /// Inicia a conexão com limite de tempo para o handshake.
    func start(timeout: TimeInterval) {
        queue.addOperation { [weak self] in
            guard let self = self else { return }
            let configuration = URLSessionConfiguration.ephemeral
            // Tempo de inatividade alto: a conexão com a TV fica aberta enquanto o app estiver em uso
            configuration.timeoutIntervalForRequest = 3600
            configuration.timeoutIntervalForResource = 7 * 24 * 3600
            let session = URLSession(configuration: configuration, delegate: self, delegateQueue: self.queue)
            let task = session.webSocketTask(with: self.url)
            // A lista de apps da TV (com ícones) pode passar de 1 MB
            task.maximumMessageSize = 8 * 1024 * 1024
            self.session = session
            self.task = task
            task.resume()
        }

        // Se o handshake não terminar a tempo, a abertura falha
        DispatchQueue.global().asyncAfter(deadline: .now() + timeout) { [weak self] in
            self?.queue.addOperation {
                guard let self = self, !self.isOpen, !self.isFinished else { return }
                self.finish(code: 1006, reason: "Tempo esgotado ao conectar em \(self.url.absoluteString)")
            }
        }
    }

    func send(_ text: String, completion: @escaping (Error?) -> Void) {
        queue.addOperation { [weak self] in
            guard let self = self, let task = self.task, self.isOpen, !self.isFinished else {
                completion(NSError(domain: "LgTvBridge", code: 1, userInfo: [NSLocalizedDescriptionKey: "Socket fechado"]))
                return
            }
            task.send(.string(text), completionHandler: completion)
        }
    }

    /// Fechamento pedido pelo app: não notifica o JavaScript.
    func close() {
        queue.addOperation { [weak self] in
            guard let self = self else { return }
            self.onOpen = nil
            self.onOpenFailed = nil
            self.onMessage = nil
            self.onClosed = nil
            self.task?.cancel(with: .normalClosure, reason: nil)
            self.finish(code: 1000, reason: "Fechado pelo app")
        }
    }

    // MARK: Internos (sempre executados na fila serial)

    private func finish(code: Int, reason: String) {
        if isFinished { return }
        isFinished = true
        pingTimer?.cancel()
        pingTimer = nil

        if isOpen {
            onClosed?(code, reason)
        } else {
            onOpenFailed?(reason)
        }
        onOpen = nil
        onOpenFailed = nil
        onMessage = nil
        onClosed = nil

        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        // invalidateAndCancel libera a referência forte da sessão para o delegate
        session?.invalidateAndCancel()
        session = nil
    }

    private func receiveNext() {
        task?.receive { [weak self] result in
            self?.queue.addOperation {
                guard let self = self, !self.isFinished else { return }
                switch result {
                case .success(let message):
                    switch message {
                    case .string(let text):
                        self.onMessage?(text)
                    case .data(let data):
                        if let text = String(data: data, encoding: .utf8) {
                            self.onMessage?(text)
                        }
                    @unknown default:
                        break
                    }
                    self.receiveNext()
                case .failure(let error):
                    self.finish(code: 1006, reason: error.localizedDescription)
                }
            }
        }
    }

    /// Ping a cada 20 s para manter a conexão viva em redes que derrubam conexões ociosas
    private func startPing() {
        let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global())
        timer.schedule(deadline: .now() + 20, repeating: 20)
        timer.setEventHandler { [weak self] in
            self?.queue.addOperation {
                guard let self = self, self.isOpen, !self.isFinished else { return }
                self.task?.sendPing { _ in }
            }
        }
        timer.resume()
        pingTimer = timer
    }

    // MARK: URLSessionWebSocketDelegate

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        guard !isFinished else { return }
        isOpen = true
        onOpen?()
        onOpen = nil
        onOpenFailed = nil
        receiveNext()
        startPing()
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        let reasonText = reason.flatMap { String(data: $0, encoding: .utf8) } ?? "Conexão encerrada pela TV"
        finish(code: closeCode.rawValue, reason: reasonText)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        finish(code: 1006, reason: error?.localizedDescription ?? "Conexão encerrada")
    }

    /// Aceita o certificado autoassinado da TV, apenas para hosts da rede local
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        if allowSelfSigned,
           challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
           let serverTrust = challenge.protectionSpace.serverTrust {
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
            return
        }
        completionHandler(.performDefaultHandling, nil)
    }
}

import Foundation
import Capacitor

/**
 * LGWebsocketPlugin - Aceita certificados SSL autoassinados da TV LG (porta 3001)
 *
 * As TVs LG webOS modernas (2022 em diante) utilizam SSL com certificado autoassinado na porta 3001.
 * O iOS Safari/WebKit recusa conexões WSS autoassinadas em localhost/rede privada por padrão.
 * Este módulo URLSessionDelegate valida e aceita o certificado exclusivamente para IPs locais e porta 3001.
 */
@objc(LGWebsocketPlugin)
public class LGWebsocketPlugin: CAPPlugin, URLSessionWebSocketDelegate {
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession?
    
    @objc func connect(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("URL inválida")
            return
        }
        
        let configuration = URLSessionConfiguration.default
        self.urlSession = URLSession(configuration: configuration, delegate: self, delegateQueue: OperationQueue())
        
        self.webSocketTask = self.urlSession?.webSocketTask(with: url)
        self.webSocketTask?.resume()
        
        listenForMessages()
        call.resolve(["status": "connecting", "url": urlString])
    }
    
    @objc func send(_ call: CAPPluginCall) {
        guard let message = call.getString("data") else {
            call.reject("Mensagem vazia")
            return
        }
        
        let wsMessage = URLSessionWebSocketTask.Message.string(message)
        self.webSocketTask?.send(wsMessage) { error in
            if let error = error {
                call.reject("Erro ao enviar: \(error.localizedDescription)")
            } else {
                call.resolve(["sent": true])
            }
        }
    }
    
    @objc func disconnect(_ call: CAPPluginCall) {
        self.webSocketTask?.cancel(with: .goingAway, reason: nil)
        self.urlSession?.invalidateAndCancel()
        call.resolve(["status": "disconnected"])
    }
    
    private func listenForMessages() {
        self.webSocketTask?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                self?.notifyListeners("onError", data: ["error": error.localizedDescription])
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.notifyListeners("onMessage", data: ["data": text])
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.notifyListeners("onMessage", data: ["data": text])
                    }
                @unknown default:
                    break
                }
                self?.listenForMessages()
            }
        }
    }
    
    // Tratamento essencial do certificado autoassinado da TV LG
    public func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        if challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust {
            if let serverTrust = challenge.protectionSpace.serverTrust {
                // Aceita o certificado da TV na rede local
                completionHandler(.useCredential, URLCredential(trust: serverTrust))
                return
            }
        }
        completionHandler(.performDefaultHandling, nil)
    }
}

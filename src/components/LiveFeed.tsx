import React, { useState } from "react";
import { Heart, MessageCircle, ShoppingBag, Share2, Bell, Plus, Send, Video, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LiveFeed() {
  // SIMULAÇÃO: Alterne para 'true' se quiser ver a live rodando, ou 'false' para a tela de espera
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);

  const [messages, setMessages] = useState([
    { id: 1, user: "Maria Silva", text: "Ansiosa para os achadinhos de hoje!" },
    { id: 2, user: "João Pedro", text: "Vai ter cupom relâmpago?" },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setMessages([...messages, { id: Date.now(), user: "Você", text: inputMessage }]);
    setInputMessage("");
  };

  // ESTADO 1: QUANDO NÃO HÁ LIVE NO MOMENTO (TELA DE ESPERA)
  if (!isLiveActive) {
    return (
      <div className="relative w-full h-[calc(100vh-8rem)] bg-zinc-950 text-white flex flex-col items-center justify-between p-6 text-center overflow-hidden">
        
        {/* Fundo com efeito borrachado / degrade */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-black to-black z-0" />

        {/* Botão de Teste Interno (Para você alternar entre Live / Sem Live facilmente) */}
        <div className="absolute top-2 right-2 z-50">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-[10px] bg-black/50 border-white/20 text-white h-7"
            onClick={() => setIsLiveActive(true)}
          >
            Simular Lojista Entrando Ao Vivo 🎥
          </Button>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 space-y-6 max-w-xs">
          <div className="w-20 h-20 rounded-full bg-orange-600/20 border border-orange-500/40 flex items-center justify-center animate-pulse">
            <Radio className="w-10 h-10 text-orange-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">Nenhuma Live no Momento</h2>
            <p className="text-xs text-zinc-400">
              A Bodega está fechando os preços e preparando os achadinhos. Ative o sininho para ser avisado quando começarmos!
            </p>
          </div>

          <div className="w-full bg-zinc-900/80 border border-white/10 p-4 rounded-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Próxima Transmissão</span>
              <span className="text-orange-400 font-bold">Hoje, 20:00</span>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30"
              onClick={() => alert("Notificação ativada! Avisaremos quando a live começar.")}
            >
              <Bell className="w-4 h-4 mr-2" /> Me Avisar
            </Button>
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-zinc-500 pb-4">
          Oxente Shoppin • Transmissões ao vivo oficiais
        </div>
      </div>
    );
  }

  // ESTADO 2: QUANDO A LIVE ESTÁ ACONTECENDO DE VERDADE
  return (
    <div className="relative w-full h-[calc(100vh-8rem)] bg-black text-white flex flex-col justify-between overflow-hidden">
      
      {/* Botão para voltar à tela de espera (para testes) */}
      <div className="absolute top-2 right-2 z-50">
        <Button 
          size="sm" 
          variant="outline" 
          className="text-[10px] bg-black/50 border-white/20 text-white h-7"
          onClick={() => setIsLiveActive(false)}
        >
          Sair da Live ✕
        </Button>
      </div>

      {/* VÍDEO DA TRANSMISSÃO */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
          alt="Transmissão Ao Vivo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
      </div>

      {/* TOPO DA LIVE */}
      <div className="relative z-10 pt-3 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">AO VIVO</span>
            <span className="text-xs text-zinc-300">| Bodega Oficial</span>
          </div>
        </div>
      </div>

      {/* CORPO DA LIVE (PRODUTO + CHAT) */}
      <div className="relative z-10 px-4 pb-4 flex justify-between items-end gap-3">
        <div className="flex-1 space-y-3 max-w-[78%]">
          
          {/* Card de Produto em Destaque na Live */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-orange-500/40 shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200" 
                alt="Produto" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="bg-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">OFERTA LIVE</span>
              <p className="text-xs font-semibold truncate text-white mt-0.5">Vestido Alfaiataria Premium</p>
              <p className="text-xs text-orange-400 font-bold">R$ 149,90</p>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-xs px-3 py-1 h-auto font-bold">
              Comprar
            </Button>
          </div>

          {/* Chat */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/5">
                <span className="font-bold text-orange-400 mr-1.5">{msg.user}:</span>
                <span className="text-zinc-200">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Enviar Mensagem */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Mande um comentário..."
              className="bg-black/50 border-white/20 text-xs text-white placeholder:text-zinc-400 h-9 rounded-full"
            />
            <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 h-9 px-3 rounded-full">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>

        {/* Ações Laterais */}
        <div className="flex flex-col items-center gap-3.5 text-xs font-medium pb-2">
          <button className="flex flex-col items-center gap-1">
            <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
            <span className="text-[11px]">2.4k</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="p-3 rounded-full bg-orange-600 border border-orange-400 shadow-lg shadow-orange-600/50">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] text-orange-400 font-bold">Vitrine</span>
          </button>
        </div>
      </div>

    </div>
  );
}
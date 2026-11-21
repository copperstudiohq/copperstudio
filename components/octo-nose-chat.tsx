"use client";

import { Send, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createOctoChat, OCTO_GREETING, OCTO_PROMPTS, replyAsOcto, type OctoMemory, type OctoReply } from "@/lib/octo-chat.mjs";
import { OCTO_VOICE_SETTINGS, selectOctoVoice } from "@/lib/octo-voice.mjs";

type ChatMessage = { id: number; speaker: "octo" | "you"; text: string; links: OctoReply["links"] };
const greeting: ChatMessage = { id: 0, speaker: "octo", text: OCTO_GREETING, links: [] };
const MESSAGE_LIMIT = 300;

function useOctoVoice() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const disableVoice = useCallback((error: unknown) => {
    enabledRef.current = false;
    setEnabled(false);
    setAvailable(false);
    console.warn("Octo Nose read-aloud is unavailable.", error);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const synthesis = window.speechSynthesis;
    synthesisRef.current = synthesis;
    const updateVoices = () => {
      try {
        const hasLocalVoice = selectOctoVoice(synthesis.getVoices()) !== null;
        setAvailable(hasLocalVoice);
        if (!hasLocalVoice) {
          enabledRef.current = false;
          setEnabled(false);
          synthesis.cancel();
        }
      } catch (error) {
        disableVoice(error);
      }
    };
    updateVoices();
    synthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      enabledRef.current = false;
      synthesis.removeEventListener("voiceschanged", updateVoices);
      try { synthesis.cancel(); }
      catch (error) { console.warn("Octo Nose could not stop read-aloud.", error); }
      synthesisRef.current = null;
    };
  }, [disableVoice]);

  const cancel = useCallback(() => {
    try { synthesisRef.current?.cancel(); }
    catch (error) { disableVoice(error); }
  }, [disableVoice]);
  const speak = useCallback((text: string) => {
    const synthesis = synthesisRef.current;
    if (!enabledRef.current || !synthesis) return;
    try {
      const voice = selectOctoVoice(synthesis.getVoices());
      if (!voice) {
        enabledRef.current = false;
        setEnabled(false);
        setAvailable(false);
        synthesis.cancel();
        return;
      }
      synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.pitch = OCTO_VOICE_SETTINGS.pitch;
      utterance.rate = OCTO_VOICE_SETTINGS.rate;
      utterance.volume = OCTO_VOICE_SETTINGS.volume;
      utterance.onerror = (event) => {
        if (event.error !== "canceled" && event.error !== "interrupted") disableVoice(event.error);
      };
      synthesis.speak(utterance);
    } catch (error) {
      disableVoice(error);
    }
  }, [disableVoice]);

  const toggle = (text: string) => {
    if (!available) return;
    enabledRef.current = !enabledRef.current;
    setEnabled(enabledRef.current);
    if (enabledRef.current) speak(text);
    else cancel();
  };
  return { available, enabled, toggle, speak, cancel };
}

export default function OctoNoseChat() {
  const memory = useRef<OctoMemory>(createOctoChat());
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [draft, setDraft] = useState("");
  const voice = useOctoVoice();

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  function sendMessage(value: string) {
    const text = value.trim().slice(0, MESSAGE_LIMIT);
    if (!text) return;
    let answer: OctoReply | null;
    try {
      answer = replyAsOcto(memory.current, text);
    } catch (error) {
      console.warn("Octo Nose could not answer.", error);
      answer = { reply: "My lantern flickered. Try asking that another way.", command: null, links: [] };
    }
    if (!answer) return;
    const additions: ChatMessage[] = [
      { id: nextId.current++, speaker: "you", text, links: [] },
      { id: nextId.current++, speaker: "octo", text: answer.reply, links: answer.links },
    ];
    setMessages((current) => [...current, ...additions].slice(-24));
    setDraft("");
    inputRef.current?.focus({ preventScroll: true });
    voice.speak(answer.reply);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
      event.preventDefault();
      sendMessage(draft);
    }
  }

  function clearChat() {
    voice.cancel();
    memory.current = createOctoChat();
    nextId.current = 1;
    setMessages([greeting]);
    setDraft("");
    inputRef.current?.focus({ preventScroll: true });
  }

  const latestReply = messages.reduce((latest, message) => message.speaker === "octo" ? message.text : latest, OCTO_GREETING);

  return (
    <section className="octo-section shell" id="octo-nose" aria-labelledby="octo-title">
      <div className="octo-heading">
        <div><span className="eyebrow">A FAMILIAR FACE, A LITTLE ADVICE</span><h2 id="octo-title">Talk to <span className="copper-text">Octo Nose.</span></h2></div>
        <span className="octo-badge">Free · Runs in your browser</span>
      </div>
      <div className="octo-layout">
        <div className="octo-profile">
          <div className="octo-portrait"><img src="/images/octo-nose-rain-copper.webp" width="1280" height="720" loading="lazy" alt="Octo Nose with the pixel cloth robe and scarf from Rain & Copper, carrying a lantern" /></div>
          <span className="octo-profile-label">OCTO NOSE / YOUR GAME GUIDE</span>
          <p>Need a hint or a world to explore? Ask about the games, tell Octo what you enjoy, or follow up for more detail. Nose jokes are welcome too.</p>
          <p className="octo-prompt-label" id="octo-starters">Start with a question</p>
          <div className="octo-prompts" aria-labelledby="octo-starters">
            {OCTO_PROMPTS.map((prompt) => <button key={prompt} type="button" aria-controls="octo-conversation" onClick={() => sendMessage(prompt)}>{prompt}</button>)}
          </div>
        </div>
        <div className="octo-panel">
          <div className="octo-panel-header"><span>A chat by lantern light</span><button className="octo-clear" type="button" onClick={clearChat}>Clear chat</button></div>
          <div className="octo-log" id="octo-conversation" ref={logRef} role="log" aria-label="Conversation with Octo Nose" aria-live="polite" aria-atomic="false" aria-relevant="additions text" tabIndex={0}>
            <ol className="octo-messages">
              {messages.map((message) => <li key={message.id} className={"octo-message octo-message-" + message.speaker}><span className="octo-speaker">{message.speaker === "octo" ? "Octo Nose" : "You"}</span><p>{message.text}</p>{message.links.length > 0 && <div className="octo-game-links">{message.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label + " (opens in a new tab)"} title="Opens in a new tab">{link.label}</a>)}</div>}</li>)}
            </ol>
          </div>
          <form className="octo-form" onSubmit={submit}>
            <label htmlFor="octo-message">Your message</label>
            <div className="octo-input-row"><textarea id="octo-message" ref={inputRef} value={draft} maxLength={MESSAGE_LIMIT} rows={2} aria-describedby="octo-input-hint octo-message-count" onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about a game, a creature, or what to play next…" /><button className="octo-send" type="submit" disabled={!draft.trim()}><span>Send</span><Send size={15} aria-hidden="true" /></button></div>
            <div className="octo-form-meta">
              <p id="octo-input-hint">Enter to send · Shift + Enter for a new line</p>
              <span className="octo-count" id="octo-message-count" aria-label={draft.length + " of " + MESSAGE_LIMIT + " characters used"}>{draft.length}/{MESSAGE_LIMIT}</span>
            </div>
          </form>
          <div className="octo-panel-footer"><p>Your chat stays in this tab. No sign-in needed.</p><button className="octo-voice" type="button" disabled={!voice.available} aria-pressed={voice.enabled} onClick={() => voice.toggle(latestReply)} title={voice.available ? "Read Octo’s replies using a voice on this device" : "No local English voice is available on this device"}><Volume2 size={14} aria-hidden="true" />{voice.available ? "Read aloud: " + (voice.enabled ? "on" : "off") : "Read aloud unavailable"}</button></div>
        </div>
      </div>
    </section>
  );
}

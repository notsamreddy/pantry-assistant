"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// TypeScript declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  new (): SpeechRecognition;
};

interface VoiceAssistantProps {
  className?: string;
}

export function VoiceAssistant({ className }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationState, setConversationState] = useState<
    "idle" | "waiting_for_address" | "processing" | "found_pantry"
  >("idle");
  const [userAddress, setUserAddress] = useState<string>("");
  const [nearestPantry, setNearestPantry] = useState<any>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pantries = useQuery(api.pantries.list);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        setError(
          "Speech recognition is not supported in this browser. Please use Chrome or Edge."
        );
        return;
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleUserInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          resolve(null);
        };
        audio.onerror = reject;
        audio.play();
      });
    } catch (error: any) {
      console.error("Error speaking:", error);
      setError(error.message);
      setIsSpeaking(false);
    }
  };

  const handleUserInput = async (input: string) => {
    if (conversationState === "idle" || conversationState === "waiting_for_address") {
      // User is providing their address
      setUserAddress(input);
      setConversationState("processing");
      await findNearestPantry(input);
    }
  };

  const findNearestPantry = async (address: string) => {
    try {
      setError("");
      
      // First, geocode the user's address
      const geocodeResponse = await fetch("/api/google/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      if (!geocodeResponse.ok) {
        const errorData = await geocodeResponse.json();
        throw new Error(errorData.error || "Failed to geocode address");
      }

      const { lat, lng } = await geocodeResponse.json();

      // Get all active pantries
      if (!pantries || pantries.length === 0) {
        await speak(
          "I'm sorry, but there are no pantries in the system yet. Please add some pantries first."
        );
        setConversationState("idle");
        return;
      }

      const activePantries = pantries.filter((p) => p.status === "active");

      if (activePantries.length === 0) {
        await speak(
          "I'm sorry, but there are no active pantries available at the moment."
        );
        setConversationState("idle");
        return;
      }

      // Find nearest pantry
      const nearestResponse = await fetch("/api/pantries/nearest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat,
          lng,
          pantries: activePantries,
        }),
      });

      if (!nearestResponse.ok) {
        const errorData = await nearestResponse.json();
        throw new Error(errorData.error || "Failed to find nearest pantry");
      }

      const { nearest } = await nearestResponse.json();

      if (!nearest) {
        await speak(
          "I'm sorry, but I couldn't find any pantries near your location."
        );
        setConversationState("idle");
        return;
      }

      setNearestPantry(nearest);
      setConversationState("found_pantry");

      // Format the response
      const distance = nearest.distance
        ? `${Math.round(nearest.distance * 10) / 10} kilometers`
        : "an unknown distance";
      const pantry = nearest.pantry;

      const responseText = `The nearest pantry to you is ${pantry.name}, located at ${pantry.address}, about ${distance} away. ${
        pantry.phoneNumber
          ? `You can contact them at ${pantry.phoneNumber}.`
          : ""
      } ${
        pantry.inventory
          ? `They typically have items like ${pantry.inventory}.`
          : ""
      }`;

      await speak(responseText);
    } catch (error: any) {
      console.error("Error finding nearest pantry:", error);
      setError(error.message);
      await speak(
        `I'm sorry, but I encountered an error: ${error.message}. Please try again.`
      );
      setConversationState("idle");
    }
  };

  const startConversation = async () => {
    setError("");
    setTranscript("");
    setUserAddress("");
    setNearestPantry(null);
    setConversationState("waiting_for_address");

    await speak(
      "Hello! I can help you find the nearest pantry. Please tell me your address."
    );

    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const resetConversation = () => {
    stopListening();
    setConversationState("idle");
    setTranscript("");
    setUserAddress("");
    setNearestPantry(null);
    setError("");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Voice Assistant</CardTitle>
        <CardDescription>
          Tell me your address and I'll find the nearest pantry for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {conversationState === "idle" ? (
            <Button
              onClick={startConversation}
              disabled={isSpeaking || !pantries}
              size="lg"
              className="gap-2"
            >
              <Mic className="h-5 w-5" />
              Start Conversation
            </Button>
          ) : (
            <>
              <Button
                onClick={isListening ? stopListening : startConversation}
                disabled={isSpeaking}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="gap-2"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Start Listening
                  </>
                )}
              </Button>
              <Button
                onClick={resetConversation}
                variant="outline"
                disabled={isSpeaking || isListening}
              >
                Reset
              </Button>
            </>
          )}
        </div>

        {(isSpeaking || isListening) && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {isSpeaking && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Speaking...</span>
              </>
            )}
            {isListening && (
              <>
                <Mic className="h-4 w-4 animate-pulse" />
                <span>Listening...</span>
              </>
            )}
          </div>
        )}

        {transcript && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">You said:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {nearestPantry && (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
            <h3 className="font-semibold mb-2">Nearest Pantry Found:</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Name:</strong> {nearestPantry.pantry.name}
              </p>
              <p>
                <strong>Address:</strong> {nearestPantry.pantry.address}
              </p>
              {nearestPantry.distance && (
                <p>
                  <strong>Distance:</strong>{" "}
                  {Math.round(nearestPantry.distance * 10) / 10} km
                </p>
              )}
              {nearestPantry.pantry.phoneNumber && (
                <p>
                  <strong>Phone:</strong> {nearestPantry.pantry.phoneNumber}
                </p>
              )}
              {nearestPantry.pantry.inventory && (
                <p>
                  <strong>Inventory:</strong> {nearestPantry.pantry.inventory}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          {conversationState === "waiting_for_address" &&
            "Please tell me your address when you're ready."}
          {conversationState === "processing" && "Finding the nearest pantry..."}
          {conversationState === "found_pantry" &&
            "Found! You can start a new conversation to search again."}
        </div>
      </CardContent>
    </Card>
  );
}


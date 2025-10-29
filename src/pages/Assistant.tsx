import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, CheckCircle2, Circle, Rocket, Building2, FileText, DollarSign, TrendingUp, Lightbulb, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PhaseCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

const PHASES: PhaseCard[] = [
  { id: "plan", title: "Plan", description: "Business ideas & planning", icon: Lightbulb, completed: false },
  { id: "register", title: "Register", description: "Legal entity & EIN", icon: Building2, completed: false },
  { id: "license", title: "License & Permit", description: "Get required permits", icon: FileText, completed: false },
  { id: "finance", title: "Finance & Funding", description: "Grants & loans", icon: DollarSign, completed: false },
  { id: "operate", title: "Operate & Grow", description: "Launch & scale", icon: TrendingUp, completed: false },
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey there! 🚀 I'm your Launch Companion. Ready to launch your Arizona business? Tell me what you're planning — for example, 'a food truck in Tucson' or 'a tech startup in Phoenix'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<string>("plan");
  const [phases, setPhases] = useState(PHASES);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      // Find the most recent session or create new one
      const { data: recentProgress } = await supabase
        .from('launch_companion_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let currentSessionId: string;
      if (recentProgress) {
        currentSessionId = recentProgress.session_id;
        setCurrentPhase(recentProgress.current_phase);
        
        // Update phase completion
        const updatedPhases = PHASES.map(phase => ({
          ...phase,
          completed: recentProgress.completed_items?.includes(phase.id) || false
        }));
        setPhases(updatedPhases);
      } else {
        currentSessionId = crypto.randomUUID();
        // Create initial progress record
        await supabase.from('launch_companion_progress').insert({
          user_id: user.id,
          session_id: currentSessionId,
          current_phase: 'plan',
          completed_items: []
        });
      }

      setSessionId(currentSessionId);

      // Load chat history for this session
      const { data: chats } = await supabase
        .from('launch_companion_chats')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (chats && chats.length > 0) {
        const chatMessages = chats.map(chat => ({
          role: chat.role as "user" | "assistant",
          content: chat.content
        }));
        setMessages([messages[0], ...chatMessages]);
      }

      setIsLoadingHistory(false);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setIsLoadingHistory(false);
      // Fallback to new session
      setSessionId(crypto.randomUUID());
    }
  };

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use Launch Companion");
        return;
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/launch-companion`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        throw new Error("Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantMessage = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Check for phase update events
            if (parsed.type === 'phase_update') {
              console.log('✅ Phase update received:', parsed);
              setCurrentPhase(parsed.phase);
              setPhases(prevPhases => {
                const updated = prevPhases.map(p => ({
                  ...p,
                  completed: p.id === parsed.completed || p.completed
                }));
                console.log('Updated phases:', updated);
                return updated;
              });
              toast.success(`Moving to ${parsed.phase.charAt(0).toUpperCase() + parsed.phase.slice(1)} phase! 🎉`);
              continue;
            }

            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    await streamChat(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const calculateProgress = () => {
    const completed = phases.filter(p => p.completed).length;
    return (completed / phases.length) * 100;
  };

  const handleClearMemory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all chats for this session
      const { error: chatError } = await supabase
        .from('launch_companion_chats')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (chatError) throw chatError;

      // Delete progress for this session
      const { error: progressError } = await supabase
        .from('launch_companion_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (progressError) throw progressError;

      // Reset local state
      setMessages([{
        role: "assistant",
        content: "Hey there! 🚀 I'm your Launch Companion. Ready to launch your Arizona business? Tell me what you're planning — for example, 'a food truck in Tucson' or 'a tech startup in Phoenix'.",
      }]);
      setCurrentPhase("plan");
      setPhases(PHASES);
      setSessionId(crypto.randomUUID());

      toast.success("Memory cleared! Starting fresh.");
    } catch (error) {
      console.error('Error clearing memory:', error);
      toast.error("Failed to clear memory. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Chat Section - Left Side */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Header */}
          <div className="border-b border-border bg-white/80 backdrop-blur-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Launch Companion</h1>
                    <p className="text-sm text-gray-600">Your Arizona business startup guide</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Clear Memory
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Launch Companion Memory?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all your chat history and reset your phase progress. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearMemory} className="bg-red-600 hover:bg-red-700">
                        Clear Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading your conversation...</span>
              </div>
            )}
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.role === "assistant" ? (
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                        <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end items-start">
                      <div className="flex-1 bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[80%] ml-auto">
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-700 text-sm font-medium">You</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 items-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="border-t border-border bg-white">
            <div className="px-6 py-4">
              <div className="flex gap-3 items-end">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-50 border-gray-200"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section - Right Side */}
        <div className="w-96 bg-white border-l border-border overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Launch Journey</h2>
              <Progress value={calculateProgress()} className="h-2" />
              <p className="text-xs text-gray-600 mt-2">{phases.filter(p => p.completed).length} of {phases.length} phases completed</p>
            </div>

            <div className="space-y-3">
              {phases.map((phase, index) => {
                const Icon = phase.icon;
                const isActive = phase.id === currentPhase;
                
                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${isActive ? 'border-blue-500 shadow-md' : 'border-gray-200'} ${phase.completed ? 'bg-green-50' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            phase.completed ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-200'
                          }`}>
                            {phase.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-sm">{phase.title}</CardTitle>
                            <CardDescription className="text-xs">{phase.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Links */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Arizona Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <a href="https://azcc.gov/ecorp" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                  → AZ Corporation Commission
                </a>
                <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                  → Apply for EIN
                </a>
                <a href="https://www.azcommerce.com/" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                  → AZ Commerce Authority
                </a>
                <a href="https://azdor.gov/" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                  → AZ Dept of Revenue
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
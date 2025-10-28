import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const EmailCapture = () => {
  const [email, setEmail] = useState("");
  const [includeLoans, setIncludeLoans] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // TODO: Connect to backend to save email subscription
    console.log({ email, includeLoans });
    setSubmitted(true);
    toast({
      title: "Success!",
      description: "You'll receive weekly funding matches in your inbox.",
    });
  };

  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Send me weekly matches</h2>
          <p className="text-muted-foreground mb-8">
            Get opportunities tailored to your business delivered to your inbox
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12"
                />
                <Button type="submit" size="lg" className="h-12 px-8">
                  <Mail className="w-5 h-5 mr-2" />
                  Subscribe
                </Button>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Checkbox
                  id="includeLoans"
                  checked={includeLoans}
                  onCheckedChange={(checked) =>
                    setIncludeLoans(checked as boolean)
                  }
                />
                <label
                  htmlFor="includeLoans"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Include loans and tax credits
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                We never sell your data.
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <CheckCircle className="w-16 h-16 text-primary" />
              <p className="text-xl font-semibold">You're all set!</p>
              <p className="text-muted-foreground">
                Check your inbox for the first matches
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

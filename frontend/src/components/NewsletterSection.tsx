import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subscribeNewsletter } from "@/lib/api";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await subscribeNewsletter(email);
      setSubscribed(true);
      setEmail("");
      toast({ title: "You're on the list", description: "Watch your inbox for early access to the next drop." });
    } catch (error) {
      toast({
        title: "Couldn't subscribe",
        description: error instanceof TypeError ? "We couldn't reach the store. Please try again." : error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#111111] py-16 sm:py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card sm:p-12"
        >
          <span className="eyebrow mb-4">
            Insider access
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            Join the <span className="text-gradient">Coolman</span> Club
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/65">
            Get early access to drops, exclusive offers, and 10% off your first order.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              aria-label="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : subscribed ? <Check size={16} /> : <Send size={16} />}
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

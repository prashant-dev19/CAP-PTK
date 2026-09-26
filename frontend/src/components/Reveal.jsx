import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 28, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const Eyebrow = ({ children, className = "" }) => (
  <Reveal className={`flex items-center gap-3 ${className}`} y={16}>
    <span className="h-px w-10 bg-gold/60" />
    <span className="text-[0.65rem] tracking-[0.3em] uppercase text-gold font-medium">{children}</span>
  </Reveal>
);

export default Reveal;

import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { navigate } from "../App";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/infinexy-logo.png"
              alt="Infinexy Logo"
              className="h-10 w-auto object-contain"
            />
            <span className="font-bold text-navy-600 text-lg tracking-tight">
              Infinexy Solution
            </span>
          </div>
          <Button
            variant="outline"
            className="border-navy-600 text-navy-600 hover:bg-navy-600 hover:text-white transition-colors"
            onClick={() => navigate("/admin")}
            data-ocid="nav.admin_portal.button"
          >
            Admin Portal
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-navy-600/10 text-navy-600 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-navy-600/20">
            <Users className="w-4 h-4" />
            Employee Registration Portal
          </div>
          <h1 className="text-6xl font-bold mb-4 leading-tight">
            <span className="text-navy-700">Infinexy</span>{" "}
            <span className="text-blue-400">Solution</span>
          </h1>
          <p className="text-gray-500 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            A trusted name in financial services. Use this portal to manage your
            team.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Button
              size="lg"
              className="bg-navy-600 hover:bg-navy-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-md"
              onClick={() => navigate("/form")}
              data-ocid="hero.register_employee.button"
            >
              Register as Employee <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-6 text-center"
          >
            {[
              {
                icon: Shield,
                title: "Secure & Compliant",
                desc: "Your data is safe with us",
              },
              {
                icon: Building2,
                title: "Financial Services",
                desc: "Trusted by professionals",
              },
              {
                icon: Users,
                title: "Team Management",
                desc: "Streamlined HR workflows",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-5 shadow-xs border border-gray-100"
              >
                <div className="w-10 h-10 bg-navy-600/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-navy-600" />
                </div>
                <h3 className="font-semibold text-navy-700 text-sm">{title}</h3>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:text-navy-600 underline"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

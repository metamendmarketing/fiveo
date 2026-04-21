/**
 * Fuel Injector Oracle | Home Page
 *
 * Renders the OracleWizard as the main interactive experience.
 * The wizard is a client component that manages its own state machine.
 */
import OracleWizard from "@/app/components/oracle/OracleWizard";

export default function Home() {
  return (
    <div className="relative">
      <div className="bg-red-600 text-white font-black text-center py-2 z-[9999] sticky top-0 uppercase tracking-widest">
        DIAGNOSTIC ACTIVE: CODE SYNC SUCCESSFUL
      </div>
      <OracleWizard />
    </div>
  );
}

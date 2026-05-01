/**
 * Fuel Injector Oracle | Home Page
 *
 * Renders the OracleWizard as the main interactive experience.
 * The wizard is a client component that manages its own state machine.
 */
import OracleWizard from "@/app/components/oracle-v2/OracleWizard";

export default function Home() {
  return (
    <div className="w-full">
      <OracleWizard />
    </div>
  );
}

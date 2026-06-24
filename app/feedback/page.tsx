import { getServerSupabase } from "@/app/lib/supabase";
import { BuildProfile } from "@/app/lib/constants";
import { ScoredProduct } from "@/app/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface FeedbackEntry {
  id: string;
  created_at: string;
  version_active: string;
  current_step: string;
  vehicle_profile: BuildProfile;
  active_results: ScoredProduct[];
  notes: string;
  reviewer_name?: string;
}

export default async function FeedbackDashboard() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("client_feedback")
    .select("*")
    .order("created_at", { ascending: false });

  const feedbackList = (data as FeedbackEntry[]) || [];

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Client Feedback Dashboard</h1>
            <p className="text-gray-400">Review feedback submissions and their active context from the Client Review Mode.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
            Back to App
          </Link>
        </header>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8">
            <h3 className="font-bold">Error loading feedback</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {feedbackList.length === 0 && !error ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <p>No feedback has been submitted yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {feedbackList.map((fb) => (
              <div key={fb.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-3 ${fb.version_active === 'V1' ? 'bg-[#00AEEF]/20 text-[#00AEEF]' : 'bg-[#E10600]/20 text-[#E10600]'}`}>
                      {fb.version_active} Logic
                    </span>
                    <h3 className="text-xl font-bold mb-1 text-white">{fb.reviewer_name || "Anonymous Reviewer"}</h3>
                    <p className="text-lg whitespace-pre-wrap text-gray-300">{fb.notes}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                    {new Date(fb.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Context Panel */}
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Profile State */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Vehicle Profile Context</h4>
                    <div className="bg-black/50 p-4 rounded-lg text-sm">
                      <p><span className="text-gray-500 w-24 inline-block">Wizard Step:</span> {fb.current_step}</p>
                      {fb.vehicle_profile?.year && (
                        <p><span className="text-gray-500 w-24 inline-block">Vehicle:</span> {fb.vehicle_profile.year} {fb.vehicle_profile.make} {fb.vehicle_profile.model}</p>
                      )}
                      {fb.vehicle_profile?.engineLabel && (
                        <p><span className="text-gray-500 w-24 inline-block">Engine:</span> {fb.vehicle_profile.engineLabel}</p>
                      )}
                      {fb.vehicle_profile?.targetHP && (
                        <p><span className="text-gray-500 w-24 inline-block">Goal HP:</span> {fb.vehicle_profile.targetHP} HP ({fb.vehicle_profile.fuelType})</p>
                      )}
                      {fb.vehicle_profile?.budget && (
                        <p><span className="text-gray-500 w-24 inline-block">Budget:</span> {fb.vehicle_profile.budget}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Active Recommendations */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Active Recommendations (Top 3)</h4>
                    {fb.active_results && fb.active_results.length > 0 ? (
                      <div className="space-y-3">
                        {fb.active_results.slice(0, 3).map((r, i) => (
                          <div key={r.product.id || i} className="bg-black/50 p-3 rounded-lg text-sm flex items-center justify-between">
                            <div>
                              <p className="font-bold text-[#00AEEF]">{r.product.name}</p>
                              <p className="text-xs text-gray-400">Score: {r.score} | {r.product.flow_rate_cc}cc</p>
                            </div>
                            {r.aiHeadline && (
                              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300">{r.aiHeadline}</span>
                            )}
                          </div>
                        ))}
                        {fb.active_results.length > 3 && (
                          <p className="text-xs text-gray-500 italic">+ {fb.active_results.length - 3} more not shown</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No recommendations were present.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

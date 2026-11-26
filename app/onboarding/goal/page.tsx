import { saveGoal } from "@/app/actions/onboarding";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";
import { Steps } from "../steps";

export default async function GoalStep({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  return (
    <div className="max-w-lg">
      <Steps current={2} />
      <h1 className="mb-4 text-2xl font-bold">How many books this year?</h1>
      <FormError message={error} />
      <form action={saveGoal} className="space-y-4">
        <input type="hidden" name="step" value="2" />
        <div>
          <label className="label" htmlFor="yearlyGoal">Yearly reading goal</label>
          <input
            className="input max-w-32"
            id="yearlyGoal"
            name="yearlyGoal"
            type="number"
            min={1}
            max={365}
            defaultValue={user.yearlyGoal}
            required
          />
        </div>
        <button className="btn">Continue</button>
      </form>
    </div>
  );
}

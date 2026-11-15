# Akiba Admin

Platform administration frontend using Next.js App Router, React, strict TypeScript and CSS Modules. Read [AGENTS.md](AGENTS.md) and the [.agents rules](.agents/README.md) before contributing.

## Human-run commands

Run commands from app/admin. Install dependencies with npm ci when needed; do not mix package managers.

```sh
npm run dev
npm run lint
npm run build
```

Only start the development server when requested. Check the frontend/API port and trusted-origin configuration before integrating authentication. There is currently no configured test runner, formatter or typecheck script.

## Shared components

Import components directly from src/components/shared; no additional dependency is required.

| Module | Exports | Behavior |
| --- | --- | --- |
| button.tsx | Button | Icons, variants, sizes, full width, pending state and async click locking |
| form.tsx | Form | FormData submission, synchronous duplicate gate, pending context and safe fallback errors |
| input.tsx | Input | Native input types, leading icon, label, hint and error |
| textarea.tsx | Textarea | Resizable native textarea with leading icon |
| select.tsx | Select | Native single choice or a checkbox dropdown for multiple choices |
| checkbox.tsx | Checkbox | Native checkbox with label, hint and error |
| radio.tsx | Radio, RadioGroup | Native radio navigation and semantic fieldset grouping |
| toast.tsx | ToastProvider, useToast | Globally mounted top-center notifications |
| icon.tsx | Icon | Lightweight decorative SVG icons; no remote icon requests |

Inputs, textareas, selects and buttons have default icons and accept a custom decorative React node through icon. Provide unique, stable id values and visible labels for form controls. Native attributes such as required, disabled, autoComplete, minLength and maxLength remain available on inputs and textareas. Checkbox and Radio accept native input attributes and refs. Radio options in one group must share a name; add required to the Radio inputs when selection is mandatory. RadioGroup groups and describes them; it does not invent a validation policy.

### Form composition

This example consumes a caller-supplied saveAction. It does not invent an API endpoint or authorize any operation. The trusted server operation must validate input, permissions and CSRF as applicable.

```tsx
"use client";

import { Button } from "@/components/shared/button";
import { Checkbox } from "@/components/shared/checkbox";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { Radio, RadioGroup } from "@/components/shared/radio";
import { Select } from "@/components/shared/select";
import { Textarea } from "@/components/shared/textarea";
import { useToast } from "@/components/shared/toast";

export function ProfileForm({
  saveAction,
}: {
  saveAction: (data: FormData) => Promise<void>;
}) {
  const toast = useToast();

  return (
    <Form onSubmitAction={async (data) => {
      await saveAction(data);
      toast.success("Changes saved.");
    }}>
      <Input id="profile-name" name="name" label="Name" required
        autoComplete="name" maxLength={100} icon={<Icon name="user" />} />
      <Input id="profile-email" name="email" type="email" label="Email"
        required autoComplete="email" />
      <Select id="profile-language" name="language" label="Language"
        required options={[{ value: "en", label: "English" }]} />
      <Select id="profile-notifications" name="notifications" label="Notifications"
        multiple options={[
          { value: "security", label: "Security updates" },
          { value: "product", label: "Product updates" },
        ]} />
      <RadioGroup id="profile-summary" label="Summary frequency">
        <Radio id="summary-daily" name="summary" value="daily" label="Daily" required />
        <Radio id="summary-weekly" name="summary" value="weekly" label="Weekly" required />
      </RadioGroup>
      <Checkbox id="profile-tips" name="tips" value="yes" label="Send helpful tips" />
      <Textarea id="profile-notes" name="notes" label="Notes" maxLength={500} />
      <Button type="submit" loadingLabel="Saving…" icon={<Icon name="check" />}>
        Save changes
      </Button>
    </Form>
  );
}
```

Apply layout spacing in the consuming feature's CSS Module. The primitives do not impose a page layout.

### Buttons and duplicate submission

- Button defaults to type="button" to prevent accidental form submission. Use type="submit" explicitly.
- Form captures FormData, including the submitter, before changing pending UI. A ref blocks repeated submit events immediately, including Enter and rapid clicks. All shared submit buttons inside it become disabled and show their loading state until the returned promise settles.
- Standalone Button awaits a returned onClick promise and blocks further clicks while it runs. Return/await the actual operation; fire-and-forget work cannot be tracked. Do not combine an asynchronous submit-button onClick with a separate form operation: async click actions cancel native submission to avoid running both.
- For React form actions, Button also observes useFormStatus. Use Form for the explicit synchronous submit gate, or implement equivalent submission handling in the feature.
- pending allows a feature to supply an external loading state. Variants are primary, secondary, danger and ghost; sizes are sm, md and lg. fullWidth fills the parent.
- The three-bead orbit indicator reserves label space and respects reduced motion. No artificial delay or simulated success is added.
- Rejected operations show generic inline feedback. Optional onErrorAction (Form) or onActionError (Button) callbacks can map errors into additional safe UI; they must not throw or log raw secrets. Handle field errors in the feature and pass safe messages through each control's error prop.

These locks prevent overlapping browser interactions, not replay from other tabs or clients. The backend still needs authorization, rate limits and idempotency. A network timeout may leave an unknown result: check the authoritative outcome before retrying. Form requires JavaScript; its POST fallback avoids putting field values in a query string, but is not a progressive-enhancement endpoint.

### Select behavior

Single selection preserves native platform keyboard and mobile behavior. Use value/defaultValue as a string. Multiple selection uses multiple={true}, string arrays, a disclosure button and native checkboxes. Options must have unique, nonempty values. Labels are plain text. Pass disabled on unavailable options.

Both modes accept name, form, required, disabled, hint, error and onValueChange. Use either controlled value with a state-updating onValueChange, or uncontrolled defaultValue. A controlled owner must update its own state on form reset; uncontrolled selections reset to their defaults. Multiple values are standard repeated FormData entries: read them with data.getAll("notifications"). The native backing select supplies required validation and excludes disabled options from submission.

Use Enter/Space to toggle the multiple-choice dropdown, ArrowDown to open and focus its first enabled checkbox, Tab to move, and Space to check. Escape, Done, outside pointer interaction and focus leaving the component close it. No focus trap is imposed. Required validation moves focus to the visible trigger when it is the first invalid form control.

Options are supplied by the feature and should be bounded. This is not a remote-search or virtualized picker. Dropdowns render locally: avoid clipping them with overflow-hidden containers; a future modal/portal integration must explicitly handle positioning and focus.

### Toasts

ToastProvider is already mounted in the root layout. Client components call useToast:

```tsx
const toast = useToast();
toast.success("Changes saved."); // Only after confirmed server success.
toast.error("We couldn't load the page. Try again.");
toast.info("Your export is being prepared.");
toast.warning("Review these changes before continuing.");
const id = toast.show({ title: "Update", message: "Settings saved.", tone: "success", duration: 8000 });
toast.dismiss(id);
```

Toasts appear at the top center with a maximum stack of four. New entries replace the oldest entry that does not own keyboard focus. Non-error defaults last six seconds; errors remain until dismissal or stack eviction. Set duration: 0 for manual dismissal. Nonzero durations are bounded to 5–60 seconds and pause while hovered, keyboard-focused or the document is hidden. Close buttons and Escape support dismissal; live regions announce messages without moving focus.

Use short safe messages. React renders them as text, not HTML. Keep important errors inline as well: a toast may be replaced. Never pass backend exception strings, credentials, MFA codes or sensitive identity details to notifications. Do not show delivery, approval or security success before the server confirms it.

## Verification

The component implementation has not been browser-tested or built by the agent. Humans should run lint/build above and check:

- Rapid double-click and repeated Enter invoke a deferred form action once; loading clears after success or rejection.
- Standalone async buttons lock until settlement; synchronous controls still work normally.
- Native validation blocks submission; a required empty multiple select focuses its visible trigger.
- Multiple selections serialize with getAll, disabled values are excluded, and uncontrolled forms reset correctly.
- Single and multiple selects work with keyboard, outside click, Escape and long labels.
- Toasts stay top-center, support dismissal/pause, remain bounded and announce through assistive technology.
- Every control has a label, visible focus and useful disabled/error states at narrow widths, high zoom, in dark mode and with reduced motion.

No test runner or new dependency was added. API integration and server-side guarantees remain the responsibility of the consuming feature and canonical backend.

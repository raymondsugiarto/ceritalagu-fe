import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LANGUAGES,
  OTHER,
  VOICES,
  labelOf,
  type ChoiceOptions,
  type QuestionnaireValues,
} from "@/lib/questionnaire";

interface ReviewStepProps {
  values: QuestionnaireValues;
  options: ChoiceOptions;
  /** Jump back to a step to edit it. */
  onEdit: (step: number) => void;
}

/** Summary of every answer before generating (PRD §5.1 "Halaman Review"). */
export function ReviewStep({ values: v, options, onEdit }: ReviewStepProps) {
  const rows: { step: number; label: string; value: string }[] = [
    {
      step: 1,
      label: "Untuk",
      value:
        v.recipient_type === OTHER
          ? v.recipient_other
          : labelOf(options.recipientTypes, v.recipient_type),
    },
    {
      step: 2,
      label: "Nama",
      value: v.recipient_nickname
        ? `${v.recipient_name} (${v.recipient_nickname})`
        : v.recipient_name,
    },
    {
      step: 3,
      label: "Momen",
      value: v.occasion === OTHER ? v.occasion_other : labelOf(options.occasions, v.occasion),
    },
    {
      step: 4,
      label: "Musik",
      value: [
        labelOf(options.genres, v.genre),
        labelOf(VOICES, v.voice),
        labelOf(LANGUAGES, v.language),
        v.mood && labelOf(options.moods, v.mood),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { step: 5, label: "Yang membuatnya spesial", value: v.special },
    { step: 6, label: "Kenangan favorit", value: v.memory },
    { step: 7, label: "Pesan dari hati", value: v.message },
    { step: 8, label: "Dikirim ke", value: `${v.email}\n${v.phone}` },
  ];

  return (
    <dl className="divide-y rounded-md border">
      {rows.map((row) => (
        <div key={row.step} className="flex items-start gap-3 p-3">
          <div className="min-w-0 flex-1 space-y-1">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="text-sm break-words whitespace-pre-line">{row.value}</dd>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Ubah ${row.label}`}
            onClick={() => onEdit(row.step)}
          >
            <PencilIcon aria-hidden />
          </Button>
        </div>
      ))}
    </dl>
  );
}

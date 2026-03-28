"use client";

type AddTrackModalProps = {
  open: boolean;
  submitting: boolean;
  value: string;
  errorMessage: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function AddTrackModal({
  open,
  submitting,
  value,
  errorMessage,
  onChange,
  onClose,
  onSubmit,
}: AddTrackModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-track-modal-title"
      >
        <h2
          id="add-track-modal-title"
          className="text-lg font-semibold text-gray-900"
        >
          곡 신청하기
        </h2>
        <div className="mt-4 space-y-3">
          <input
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="유튜브 링크를 입력하세요"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
          />
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? "신청 중..." : "신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

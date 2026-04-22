import { useLanguage } from "../i18n/language.js";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onCancel,
  onConfirm,
}) {
  const { t } = useLanguage();

  if (!title && !message) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-mark" aria-hidden="true">
          !
        </div>
        <div className="confirm-dialog-copy">
          <p className="eyebrow">{t("Confirmação")}</p>
          <h2>{t(title)}</h2>
          {message && <p>{t(message)}</p>}
        </div>
        <div className="confirm-dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            {t(cancelLabel)}
          </button>
          <button className={variant === "danger" ? "danger-button" : "primary-button"} type="button" onClick={onConfirm}>
            {t(confirmLabel)}
          </button>
        </div>
      </section>
    </div>
  );
}
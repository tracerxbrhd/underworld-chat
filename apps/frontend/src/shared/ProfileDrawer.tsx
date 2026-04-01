import { useEffect, useState } from "react";

import type { ProfilePayload } from "./api";
import { useI18n } from "./i18n";

const fallbackAvatar =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='24' fill='%2309140e'/><path d='M48 49c10.493 0 19-8.507 19-19S58.493 11 48 11 29 19.507 29 30s8.507 19 19 19Zm0 8c-15.464 0-28 8.73-28 19.5C20 79.538 21.962 82 24.381 82h47.238C74.038 82 76 79.538 76 76.5 76 65.73 63.464 57 48 57Z' fill='%2353f58f'/></svg>";

type ProfileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<ProfilePayload>) => Promise<unknown> | unknown;
  profile: ProfilePayload;
};

export function ProfileDrawer({ isOpen, onClose, onSave, profile }: ProfileDrawerProps) {
  const { copy } = useI18n();
  const [form, setForm] = useState(profile);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        aria-labelledby="profile-drawer-title"
        aria-modal="true"
        className="profile-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{copy.workspace.shellTag}</p>
            <h2 id="profile-drawer-title">{copy.workspace.profileTitle}</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            {copy.common.close}
          </button>
        </div>

        <label className="field">
          <span>{copy.workspace.avatarLabel}</span>
          <input
            type="url"
            value={form.avatar}
            onChange={(event) => setForm({ ...form, avatar: event.target.value })}
          />
        </label>

        <label className="field">
          <span>{copy.workspace.nameLabel}</span>
          <input
            type="text"
            value={form.display_name}
            onChange={(event) => setForm({ ...form, display_name: event.target.value })}
          />
        </label>

        <label className="field">
          <span>{copy.workspace.bioLabel}</span>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </label>

        <label className="field">
          <span>{copy.workspace.birthDateLabel}</span>
          <input
            type="date"
            value={form.birth_date ?? ""}
            onChange={(event) => setForm({ ...form, birth_date: event.target.value })}
          />
        </label>

        <label className="field">
          <span>{copy.workspace.immutableLogin}</span>
          <input readOnly type="text" value={form.public_id} />
          <small>{copy.workspace.immutableLoginHint}</small>
        </label>

        <section className="drawer-preview">
          <p className="eyebrow">{copy.workspace.previewTitle}</p>
          <div className="profile-preview-card">
            <img alt={form.display_name} className="profile-avatar large" src={form.avatar || fallbackAvatar} />
            <div>
              <h3>{form.display_name}</h3>
              <p className="muted">@{form.public_id}</p>
              <p>{form.bio}</p>
            </div>
          </div>
        </section>

        <div className="drawer-actions">
          <p className="muted">{copy.workspace.profileSaved}</p>
          <button
            className="primary-button"
            onClick={async () => {
              setSaving(true);
              try {
                await Promise.resolve(onSave(form));
                onClose();
              } finally {
                setSaving(false);
              }
            }}
            type="button"
          >
            {isSaving ? copy.common.loading : copy.common.save}
          </button>
        </div>
      </aside>
    </div>
  );
}

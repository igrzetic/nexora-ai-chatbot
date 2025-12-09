import React, { useState, useRef, useEffect } from 'react';
import '../styles/settings.css';

interface AuthUser {
  id?: number;
  email: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

type SettingsTab = 'account' | 'help' | 'delete';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user }) => {
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('account');

  const [pwdForm, setPwdForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Refs za tab gumbe (za dinamički indicator)
  const accountTabRef = useRef<HTMLButtonElement | null>(null);
  const helpTabRef = useRef<HTMLButtonElement | null>(null);
  const deleteTabRef = useRef<HTMLButtonElement | null>(null);

  // Style za tab-indicator (width + translateX)
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  // Placeholder za backend poziv – promjena lozinke
  const changePasswordOnServer = async (params: {
    email: string;
    currentPassword: string;
    newPassword: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  // Placeholder za backend poziv – brisanje računa
  const deleteAccountOnServer = async (params: { email: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPwdForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPwdError(null);
    setPwdSuccess(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    const { current, next, confirm } = pwdForm;

    if (!current || !next || !confirm) {
      setPwdError('Molim te ispuni sva polja.');
      return;
    }

    if (next.length < 8) {
      setPwdError('Nova lozinka treba imati barem 8 znakova.');
      return;
    }

    if (next !== confirm) {
      setPwdError('Nova lozinka i potvrda se ne podudaraju.');
      return;
    }

    if (!user?.email) {
      setPwdError('Nisi prijavljen. Prijavi se pa pokušaj ponovno.');
      return;
    }

    try {
      await changePasswordOnServer({
        email: user.email,
        currentPassword: current,
        newPassword: next,
      });

      setPwdSuccess('Lozinka je uspješno promijenjena (demo).');
    } catch (err: any) {
      console.error(err);
      setPwdError(
        err?.message || 'Došlo je do greške pri promjeni lozinke.',
      );
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!user?.email) {
      setPwdError('Nisi prijavljen. Prijavi se pa pokušaj ponovno.');
      return;
    }

    if (!deleteConfirm) {
      setPwdError('Molim te upiši svoju email adresu za potvrdu.');
      return;
    }

    if (deleteConfirm !== user.email) {
      setPwdError('Upisana email adresa se ne podudara s tvojim računom.');
      return;
    }

    try {
      await deleteAccountOnServer({ email: user.email });
      setPwdSuccess('Račun bi sada bio obrisan (demo).');
      // Ovdje bi u pravoj aplikaciji odjavili korisnika, redirect, itd.
    } catch (err: any) {
      console.error(err);
      setPwdError(
        err?.message || 'Došlo je do greške pri brisanju računa.',
      );
    }
  };

  const handleClose = () => {
    // Reset lokalnog state-a
    setSettingsTab('account');
    setPwdForm({ current: '', next: '', confirm: '' });
    setDeleteConfirm('');
    setPwdError(null);
    setPwdSuccess(null);
    onClose();
  };

  // Dinamičko pozicioniranje & širina indikatora
  useEffect(() => {
    if (!isOpen) return;

    const updateIndicator = () => {
      let activeEl: HTMLButtonElement | null = null;

      if (settingsTab === 'account') activeEl = accountTabRef.current;
      else if (settingsTab === 'help') activeEl = helpTabRef.current;
      else activeEl = deleteTabRef.current;

      if (!activeEl) return;

      const { offsetLeft, offsetWidth } = activeEl;

      setIndicatorStyle({
        width: offsetWidth,
        transform: `translateX(${offsetLeft}px)`,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [settingsTab, isOpen]);

  // 🔹 VAŽNO: after all hooks
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="modal" data-tab={settingsTab}>
        <div className="modal-header">
          <h2>Postavke</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Zatvori postavke"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <div className="tab-indicator" style={indicatorStyle} />

          <button
            type="button"
            ref={accountTabRef}
            className={`modal-tab ${settingsTab === 'account' ? 'active' : ''}`}
            onClick={() => {
              setSettingsTab('account');
              setPwdError(null);
              setPwdSuccess(null);
            }}
          >
            Račun
          </button>

          <button
            type="button"
            ref={helpTabRef}
            className={`modal-tab ${settingsTab === 'help' ? 'active' : ''}`}
            onClick={() => {
              setSettingsTab('help');
              setPwdError(null);
              setPwdSuccess(null);
            }}
          >
            Pomoć
          </button>

          <button
            type="button"
            ref={deleteTabRef}
            className={`modal-tab ${settingsTab === 'delete' ? 'active' : ''}`}
            onClick={() => {
              setSettingsTab('delete');
              setPwdError(null);
              setPwdSuccess(null);
            }}
          >
            Brisanje računa
          </button>
        </div>

        <div className="modal-body">
          {settingsTab === 'account' && (
            <div className="tab-content">
              <form
                className="modal-form"
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                {user?.email && (
                  <p className="field-hint" style={{ marginBottom: 6 }}>
                    Prijavljen si kao: <strong>{user.email}</strong>
                  </p>
                )}

                <div className="form-group">
                  <label className="field-label" htmlFor="current">
                    Trenutna lozinka
                  </label>
                  <input
                    id="current"
                    name="current"
                    type="password"
                    className="field-input"
                    value={pwdForm.current}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="next">
                    Nova lozinka
                  </label>
                  <input
                    id="next"
                    name="next"
                    type="password"
                    className="field-input"
                    value={pwdForm.next}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />
                  <p className="field-hint">
                    Minimalno 8 znakova. Preporuka: kombinacija slova, brojeva i
                    simbola.
                  </p>
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="confirm">
                    Potvrda nove lozinke
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    className="field-input"
                    value={pwdForm.confirm}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />
                </div>

                {pwdError && settingsTab === 'account' && (
                  <div className="form-status form-status-error">
                    {pwdError}
                  </div>
                )}

                {pwdSuccess && settingsTab === 'account' && (
                  <div className="form-status form-status-success">
                    {pwdSuccess}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="primary-btn">
                    Spremi lozinku
                  </button>
                </div>
              </form>
            </div>
          )}

          {settingsTab === 'help' && (
            <div className="tab-content">
              <div className="modal-help">
                <div className="modal-help-section">
                  <h3>Kako koristiti Nexoru?</h3>
                  <p>
                    Jednostavno postavi pitanje ili zalijepi kod. Nexora će
                    pokušati objasniti, optimizirati ili nadopuniti tvoj kod na
                    razumljiv način.
                  </p>
                </div>

                <div className="modal-help-section">
                  <h3>Tipovi pitanja</h3>
                  <ul>
                    <li>Debugiranje i traženje bugova u kodu.</li>
                    <li>Pisanje novih komponenti ili funkcija.</li>
                    <li>Objašnjenja TS/JS/React/Node koncepata.</li>
                  </ul>
                </div>

                <div className="modal-help-section">
                  <h3>Trebaš dodatnu pomoć?</h3>
                  <p>
                    Ako imaš specifičan problem, pokušaj što bolje opisati
                    kontekst (stack, verzije, error poruke) i Nexora će ti dati
                    preciznije rješenje.
                  </p>
                  <button type="button" className="secondary-btn">
                    Otvori dokumentaciju (placeholder)
                  </button>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'delete' && (
            <div className="tab-content">
              <form className="modal-form" onSubmit={handleDeleteSubmit}>
                <h3 className="danger-title">Trajno brisanje računa</h3>
                <p className="field-hint">
                  Ova akcija je <strong>nepovratna</strong>. Svi podaci povezani s tvojim
                  računom bit će obrisani. Upiši svoju email adresu za potvrdu.
                </p>

                {user?.email && (
                  <p className="field-hint" style={{ marginBottom: 6 }}>
                    Tvoja email adresa: <strong>{user.email}</strong>
                  </p>
                )}

                <div className="form-group">
                  <label className="field-label" htmlFor="delete-confirm">
                    Potvrdi email adresu
                  </label>
                  <input
                    id="delete-confirm"
                    name="delete-confirm"
                    type="email"
                    className="field-input"
                    value={deleteConfirm}
                    onChange={(e) => {
                      setDeleteConfirm(e.target.value);
                      setPwdError(null);
                      setPwdSuccess(null);
                    }}
                    placeholder="upiši svoju email adresu"
                  />
                </div>

                {pwdError && settingsTab === 'delete' && (
                  <div className="form-status form-status-error">
                    {pwdError}
                  </div>
                )}

                {pwdSuccess && settingsTab === 'delete' && (
                  <div className="form-status form-status-success">
                    {pwdSuccess}
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="danger-btn">
                    Trajno izbriši račun
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

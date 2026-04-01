import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, TextField, Flex } from '../../ui';
import type { ViewScope } from '../../types/savedView';

interface SaveViewModalProps {
  initialName?: string;
  forcedScope?: ViewScope;
  onSave: (name: string, scope: ViewScope, isDefault: boolean) => void;
  onClose: () => void;
}

export const SaveViewModal: React.FC<SaveViewModalProps> = ({
  initialName = '',
  forcedScope,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [scope, setScope] = useState<ViewScope>(forcedScope ?? 'personal');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = nameRef.current?.querySelector('input');
    if (input) { input.focus(); input.select(); }
  }, []);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a view name'); return; }
    onSave(trimmed, scope, isDefault);
  };

  return (
    <Modal title="Save Order Browse View" onCloseClick={onClose}>
      <div className="svm">
        <div className="svm__fields">
          <div ref={nameRef}>
            <TextField
              label="View Name"
              value={name}
              onChange={(v) => { setName(v); setError(''); }}
              placeholder="e.g. My Shipping Layout"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
            {error && <span className="svm__error">{error}</span>}
          </div>

          <fieldset className="svm__scope-fieldset">
            <legend className="svm__scope-legend">Who can see this view?</legend>
            <label className={`svm__scope-option ${scope === 'personal' ? 'svm__scope-option--selected' : ''}`}>
              <input
                type="radio"
                name="view-scope"
                value="personal"
                checked={scope === 'personal'}
                onChange={() => setScope('personal')}
                disabled={forcedScope !== undefined}
              />
              <span className="svm__scope-option-body">
                <span className="svm__scope-option-title">{'\u{1F464}'} Only me</span>
                <span className="svm__scope-option-desc">
                  Only you can see and use this view. You can edit or overwrite it any time.
                </span>
              </span>
            </label>
            <label className={`svm__scope-option ${scope === 'shared' ? 'svm__scope-option--selected' : ''}`}>
              <input
                type="radio"
                name="view-scope"
                value="shared"
                checked={scope === 'shared'}
                onChange={() => setScope('shared')}
                disabled={forcedScope !== undefined}
              />
              <span className="svm__scope-option-body">
                <span className="svm__scope-option-title">{'\u{1F310}'} Shared with client users</span>
                <span className="svm__scope-option-desc">
                  All users in your organization will see this view. You cannot overwrite it directly after saving.
                </span>
              </span>
            </label>
          </fieldset>

          <label className="svm__default-check">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span>Set as my default Order Browse view</span>
          </label>

          <div className="svm__summary">
            <div className="svm__summary-title">What gets saved</div>
            <p className="svm__summary-text">
              Column visibility, display order, captions, widths, number formatting, and decimal precision.
              Filters and sort order are not included.
            </p>
          </div>
        </div>

        <Flex style={{ justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save View</Button>
        </Flex>
      </div>
    </Modal>
  );
};

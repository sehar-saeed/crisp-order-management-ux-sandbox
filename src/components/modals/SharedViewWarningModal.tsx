import React from 'react';
import { Modal, Button, Flex } from '../../ui';

interface SharedViewWarningModalProps {
  viewName: string;
  onSaveAs: () => void;
  onClose: () => void;
}

export const SharedViewWarningModal: React.FC<SharedViewWarningModalProps> = ({
  viewName,
  onSaveAs,
  onClose,
}) => (
  <Modal title="Cannot Overwrite Shared View" onCloseClick={onClose}>
    <div className="svw">
      <div className="svw__icon">{'\u{1F310}'}</div>
      <p className="svw__message">
        <strong>&ldquo;{viewName}&rdquo;</strong> is a shared view visible to all users
        in your organization. To protect other users, shared views cannot be overwritten directly.
      </p>
      <p className="svw__guidance">
        Use <strong>Save As</strong> to create a personal copy with your changes.
      </p>
      <Flex style={{ justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={onSaveAs}>Save As New View</Button>
      </Flex>
    </div>
  </Modal>
);

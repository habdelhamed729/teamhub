import React from 'react';
import { useParams } from 'react-router-dom';
import { MemberList } from '../components/MemberList';

export const MembersPage: React.FC = () => {
  const { workspaceId } = useParams();
  if (!workspaceId) return <div>Workspace not specified</div>;

  return (
    <div className="p-6">
      <MemberList workspaceId={workspaceId} />
    </div>
  );
};

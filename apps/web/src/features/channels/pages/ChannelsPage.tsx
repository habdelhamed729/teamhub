import React from 'react';
import { useParams } from 'react-router-dom';
import { ChannelList } from '../components/ChannelList';

export const ChannelsPage: React.FC = () => {
  const { workspaceId } = useParams();
  if (!workspaceId) return <div>Workspace not specified</div>;

  return (
    <div className="p-6">
      <ChannelList workspaceId={workspaceId} />
    </div>
  );
};

import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "@/shared/components/RouteGuards";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { WorkspaceSelectionPage } from "@/features/workspace/pages/WorkspaceSelectionPage";
import { SettingsLayout } from "@/app/layouts/SettingsLayout";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { WorkspacePage } from "@/features/workspace/pages/WorkspacePage";
import { MembersPage } from "@/features/members/pages/MembersPage";
import { ChannelsPage } from "@/features/channels/pages/ChannelsPage";
import { ChannelPage } from "@/features/channels/pages/ChannelPage";
import { DirectMessagesPage } from "@/features/messages/pages/DirectMessagesPage";
import { DocumentsPage } from "@/features/documents/pages/DocumentsPage";
import { DocumentEditorPage } from "@/features/documents/pages/DocumentEditorPage";

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/workspaces", element: <WorkspaceSelectionPage /> },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: (
              <div className="p-10 text-white">Welcome to the Dashboard!</div>
            ),
          },
          {
            path: "/workspaces/:workspaceId/members",
            element: <MembersPage />,
          },
          {
            path: "/workspaces/:workspaceId/messages",
            element: <DirectMessagesPage />,
          },
          {
            path: "/workspaces/:workspaceId/channels",
            element: <ChannelsPage />,
          },
          {
            path: "/workspaces/:workspaceId/channels/:channelId",
            element: <ChannelPage />,
          },
          {
            path: "/workspaces/:workspaceId/documents",
            element: <DocumentsPage />,
          },
          {
            path: "/workspaces/:workspaceId/docs/:documentId",
            element: <DocumentEditorPage />,
          },
          {
            path: "/settings",
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="profile" replace /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "workspace", element: <WorkspacePage /> },
            ],
          },
        ],
      },
    ],
  },

  {
    path: "/",
    element: <Navigate to="/workspaces" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import LoadingScreen from "./components/common/LoadingScreen";
import { Toaster, ToasterProvider } from "./components/ui/Toaster";
import { ProtectedRoutes, PublicRoutes } from "./config/routes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePosts } from "./hooks/usePosts";

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading, error: postsError, refreshPosts, addPost, updatePost, deletePost } = usePosts();

  if (authLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  const postsProps = {
    posts,
    loading: postsLoading,
    error: postsError,
    onPostUpdate: updatePost,
    onPostDelete: deletePost,
    onRefresh: refreshPosts,
  };
  const editorProps = { onPostCreate: addPost, onPostUpdate: updatePost };

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <div className="min-h-screen bg-background">
        {isAuthenticated ? (
          <Layout>
            <ErrorBoundary>
              <ProtectedRoutes postsProps={postsProps} editorProps={editorProps} />
            </ErrorBoundary>
          </Layout>
        ) : (
          <ErrorBoundary>
            <PublicRoutes />
          </ErrorBoundary>
        )}
        <Toaster />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ToasterProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ToasterProvider>
  );
}

export default App;

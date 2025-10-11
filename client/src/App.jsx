import React, { lazy, Suspense } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster, ToasterProvider } from "./components/ui/Toaster";
import { ROUTES } from "./constants";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePosts } from "./hooks/usePosts";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Editor = lazy(() => import("./pages/Editor"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const Settings = lazy(() => import("./pages/Settings"));

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading, error: postsError, refreshPosts, addPost, updatePost, deletePost } = usePosts();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <div className="min-h-screen bg-background">
        {isAuthenticated ? (
          <Layout>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
                }
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard
                          posts={posts}
                          loading={postsLoading}
                          error={postsError}
                          onPostUpdate={updatePost}
                          onPostDelete={deletePost}
                          onRefresh={refreshPosts}
                        />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/editor"
                    element={
                      <ProtectedRoute>
                        <Editor onPostCreate={addPost} onPostUpdate={updatePost} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/editor/:id"
                    element={
                      <ProtectedRoute>
                        <Editor onPostCreate={addPost} onPostUpdate={updatePost} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Layout>
        ) : (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
              }
            >
              <Routes>
                <Route path={ROUTES.LOGIN} element={<Login />} />
                <Route path={ROUTES.REGISTER} element={<Register />} />
                <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
              </Routes>
            </Suspense>
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

import { useEffect, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster, ToasterProvider } from "./components/ui/Toaster";
import { DEFAULT_PAGINATION } from "./constants";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import { apiClient } from "./utils/apiClient";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  const fetchPosts = async () => {
    try {
      const data = await apiClient.getPosts(DEFAULT_PAGINATION);
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const updatePost = (updatedPost) => {
    setPosts(posts.map((post) => (post.id === updatedPost.id || post._id === updatedPost._id ? updatedPost : post)));
  };

  const deletePost = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId && post._id !== postId));
  };

  if (loading) {
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
    <Router future={{ v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-background">
        {isAuthenticated ? (
          <Layout>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard
                      posts={posts}
                      loading={postsLoading}
                      onPostUpdate={updatePost}
                      onPostDelete={deletePost}
                      onRefresh={fetchPosts}
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
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

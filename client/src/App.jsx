import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Toaster, ToasterProvider } from "./components/ui/Toaster";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Settings from "./pages/Settings";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const updatePost = (updatedPost) => {
    setPosts(posts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  const deletePost = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  return (
    <ToasterProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Layout>
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    posts={posts}
                    loading={loading}
                    onPostUpdate={updatePost}
                    onPostDelete={deletePost}
                    onRefresh={fetchPosts}
                  />
                }
              />
              <Route
                path="/editor"
                element={<Editor onPostCreate={addPost} onPostUpdate={updatePost} />}
              />
              <Route
                path="/editor/:id"
                element={<Editor onPostCreate={addPost} onPostUpdate={updatePost} />}
              />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          <Toaster />
        </div>
      </Router>
    </ToasterProvider>
  );
}

export default App;

import { useState, useEffect } from "react";

const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:4000" 
  : window.location.origin;

export default function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlError = searchParams.get("error");
    const urlErrorDesc = searchParams.get("error_description");
    if (urlError) {
      setError(`OIDC Error: ${urlError} - ${urlErrorDesc || ""}`);
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: "include", 
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.log("Not authenticated yet.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/todos`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTodos(data.todos);
      }
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    }
  };

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setUser(null);
        setTodos([]);
      }
    } catch (err) {
      console.error("Log out failed:", err);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTodos((prev) => [...prev, data.todo]);
        setTask("");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/todos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        Checking session status...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10">
      
      {!user ? (
        <div className="relative w-full max-w-md">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative w-full bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/50 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>

            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">TaskMaster Pro</h1>
            <p className="text-neutral-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed font-sans">
              Organize your workflow using your centralized OIDC identity. Connect to your custom authentication server.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl mb-6 text-left leading-normal font-mono break-words">
                {error}
              </div>
            )}

            <div className="inline-flex items-center space-x-2 bg-neutral-950/60 border border-neutral-800 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span class="text-xs font-semibold text-neutral-400">OIDC Server Connected</span>
            </div>

            <button
              onClick={handleLogin}
              className="inline-flex w-full items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition duration-300 shadow-lg shadow-purple-900/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 space-x-3 cursor-pointer text-sm font-sans"
            >
              <span>Login with Custom OIDC</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-6">
          
          <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                TM
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-none">TaskMaster</h2>
                <span className="text-xs text-neutral-500">Secured via OIDC</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-700 transition cursor-pointer"
            >
              Log Out
            </button>
          </div>

          <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Authenticated OIDC Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/80 border border-neutral-850 rounded-2xl p-5 text-sm">
              <div>
                <span className="text-neutral-500 font-medium block">Name</span>
                <span className="text-white font-semibold text-base mt-0.5 block">{user.name}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium block">Email Address</span>
                <span className="text-white font-semibold text-base mt-0.5 block">{user.email}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium block">Subject ID (sub)</span>
                <span className="text-purple-400 font-mono text-xs break-all mt-1 block">{user.sub}</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 shadow-lg space-y-6">
            <h3 className="text-xl font-bold text-white">Your Tasks</h3>

            <div className="space-y-3">
              {todos.length === 0 ? (
                <div className="text-center py-10 bg-neutral-950/50 border border-dashed border-neutral-800 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 mx-auto text-neutral-600 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 18.666A12 12 0 0 0 21 12h-3m-1.5 5.908a3 3 0 1 1-4.243-4.243l3.243-3.242" />
                  </svg>
                  <p className="text-sm text-neutral-500">No tasks registered under your ID yet. Add one below!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between bg-neutral-950/80 border border-neutral-850 rounded-2xl p-4 transition hover:border-neutral-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full border border-purple-500/50 flex items-center justify-center text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="text-neutral-200 text-sm font-medium">{todo.task}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            
            <form onSubmit={handleAddTodo} className="flex items-center space-x-3 pt-4 border-t border-neutral-850">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-2xl px-5 py-3.5 text-neutral-100 placeholder-neutral-500 outline-none transition text-sm font-sans"
                required
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-6 rounded-2xl transition duration-300 shadow-md shadow-purple-900/20 text-sm whitespace-nowrap cursor-pointer font-sans"
              >
                Add Task
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}

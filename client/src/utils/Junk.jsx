useEffect(() => {
    const loadSession = async () => {
      if (sessionId == null) {
        // get a session
        const session = await api.createSession();
        setSessionId(session.sessionId);
        localStorage.setItem('sessionId', session.sessionId);
      } else {
        setIsAuthenticated(true);
        const userRole = localStorage.getItem('userRole');
        setIsAdmin(userRole === 'admin');
        // Restore user data if available
        const userData = localStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    };

    loadSession();
  }, []);
import { HashRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import { QuizProvider } from './context/QuizContext';
import { ScoresProvider } from './context/ScoresContext';
import { SearchProvider } from './context/SearchContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { MessagesProvider } from './context/MessagesContext';
import { FavoritesProvider } from './context/FavoritesContext';
import CreateQuiz from './pages/create';
import MyQuizzes from './pages/MyQuizzes';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Play from './pages/play';
import QuizDetail from './pages/QuizDetail';
import Results from './pages/Results';
import Review from './pages/Review';
import {ReactionsProvider} from "./context/ReactionsContext";
import Messaging from './components/Messaging';
import QuizSharing from './components/QuizSharing';
import CreatedQuizzes from './pages/CreatedQuizzes';
import SharedQuizzes from './pages/SharedQuizzes';
import Login from './components/Login';
import Register from './components/Register';
import Favorites from './pages/Favorites';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModalProvider>
          <MessagesProvider>
          <ReactionsProvider>
            <ScoresProvider>
              <QuizProvider>
                <FavoritesProvider>
                  <SearchProvider>
                    <HashRouter
                      future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                      }}
                    >
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/create" element={<CreateQuiz />} />
                          <Route path="/edit/:quizId" element={<CreateQuiz />} />
                          <Route path="/my-quizzes" element={<MyQuizzes />} />
                          <Route path="/quiz/:quizId" element={<QuizDetail />} />
                          <Route path="/play/:quizId" element={<Play />} />
                          <Route path="/results/:quizId" element={<Results />} />
                          <Route path="/review/:quizId" element={<Review />} />
                          <Route path="/messages" element={<Messaging />} />
                          <Route path="/shared-quizzes" element={<QuizSharing />} />
                          <Route path="/favorites" element={<Favorites />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Layout>
                    </HashRouter>
                  </SearchProvider>
                </FavoritesProvider>
              </QuizProvider>
            </ScoresProvider>
          </ReactionsProvider>
          </MessagesProvider>
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

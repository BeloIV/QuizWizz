import { HashRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import { QuizProvider } from './context/QuizContext';
import { ScoresProvider } from './context/ScoresContext';
import { SearchProvider } from './context/SearchContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import CreateQuiz from './pages/create';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Play from './pages/play';
import QuizDetail from './pages/QuizDetail';
import Results from './pages/Results';
import Review from './pages/Review';
import {ReactionsProvider} from "./context/ReactionsContext";
import Messaging from './components/Messaging';
import QuizSharing from './components/QuizSharing';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactionsProvider>
          <ScoresProvider>
            <QuizProvider>
              <SearchProvider>
                <HashRouter>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/create" element={<CreateQuiz />} />
                      <Route path="/quiz/:quizId" element={<QuizDetail />} />
                      <Route path="/play/:quizId" element={<Play />} />
                      <Route path="/results/:quizId" element={<Results />} />
                      <Route path="/review/:quizId" element={<Review />} />
                      <Route path="/messages" element={<Messaging />} />
                      <Route path="/shared-quizzes" element={<QuizSharing />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </HashRouter>
              </SearchProvider>
            </QuizProvider>
          </ScoresProvider>
        </ReactionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

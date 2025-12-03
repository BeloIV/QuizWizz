import { HashRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import { QuizProvider } from './context/QuizContext';
import { ScoresProvider } from './context/ScoresContext';
import { SearchProvider } from './context/SearchContext';
import { ThemeProvider } from './context/ThemeContext';
import CreateQuiz from './pages/CreateQuiz';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Play from './pages/Play';
import QuizDetail from './pages/QuizDetail';
import Results from './pages/Results';
import {ReactionsProvider} from "./context/ReactionsContext";

function App() {
  return (
    <ThemeProvider>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </HashRouter>
            </SearchProvider>
          </QuizProvider>
        </ScoresProvider>
      </ReactionsProvider>
    </ThemeProvider>
  );
}

export default App;

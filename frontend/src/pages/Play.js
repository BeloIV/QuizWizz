import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useQuizDetail } from '../hooks/useQuizDetail';

function Play() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [disabledOptions, setDisabledOptions] = useState({});
  const [reveal, setReveal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const initiallyWrongRef = useRef(new Set());
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIndex(0);
    setSelectedIndex(null);
    setDisabledOptions({});
    setReveal(false);
    setProcessing(false);
    initiallyWrongRef.current = new Set();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [quizId, quiz?.id]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentQuestion = useMemo(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return null;
    }
    return quiz.questions[index] || null;
  }, [quiz, index]);

  const correctIndex = currentQuestion?.correct_index;
  const totalQuestions = quiz?.questions?.length || 0;

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length === 0 && !loading && !error) {
      navigate(`/results/${quiz.id}?score=0&wrong=`);
    }
  }, [quiz, loading, error, navigate]);

  const handleSubmit = (overrideIndex) => {
    if (!quiz || !currentQuestion || processing || reveal) {
      return;
    }
    const chosenIndex = typeof overrideIndex === 'number' ? overrideIndex : selectedIndex;
    if (chosenIndex === null || chosenIndex === undefined) {
      return;
    }

    if (chosenIndex === correctIndex) {
      setReveal(true);
      setProcessing(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const nextIndex = index + 1;
        if (nextIndex >= totalQuestions) {
          const wrongIds = Array.from(initiallyWrongRef.current);
          const wrongCount = wrongIds.length;
          const score = totalQuestions
            ? Math.round(((totalQuestions - wrongCount) / totalQuestions) * 100)
            : 0;
          navigate(`/results/${quiz.id}?score=${score}&wrong=${wrongIds.join(',')}`);
        } else {
          setIndex(nextIndex);
        }
        setSelectedIndex(null);
        setReveal(false);
        setProcessing(false);
      }, 900);
    } else {
      initiallyWrongRef.current.add(currentQuestion.id);
      setDisabledOptions((prev) => {
        const existing = new Set(prev[currentQuestion.id] || []);
        existing.add(chosenIndex);
        return { ...prev, [currentQuestion.id]: Array.from(existing) };
      });
      setSelectedIndex(null);
    }
  };

  const handleOptionClick = (optionIndex) => {
    if (processing || reveal) {
      return;
    }
    setSelectedIndex(optionIndex);
    handleSubmit(optionIndex);
  };

  if (loading) {
    return <div className="muted">Loading quiz...</div>;
  }

  if (error || !quiz) {
    return <div className="empty">Quiz not found.</div>;
  }

  if (!currentQuestion) {
    return null;
  }

  const disabledForQuestion = new Set(disabledOptions[currentQuestion.id] || []);
  const canSubmit = selectedIndex !== null && !processing && !reveal;
  const progress = `${index + 1} / ${totalQuestions}`;

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="pill">{quiz.name}</span>
        <span className="muted">{progress}</span>
      </div>
      <div className="card">
        <div className="question">{currentQuestion.text}</div>
        <div className="options" id="options">
          {currentQuestion.options.map((option) => {
            const optionIndex = option.index;
            const classNames = ['option'];
            if (disabledForQuestion.has(optionIndex)) {
              classNames.push('incorrect');
            }
            if (reveal && optionIndex === correctIndex) {
              classNames.push('correct');
            }
            if (!reveal && selectedIndex === optionIndex) {
              classNames.push('selected');
            }
            const isDisabled = processing || reveal || disabledForQuestion.has(optionIndex);
            return (
              <button
                key={optionIndex}
                type="button"
                className={classNames.join(' ')}
                onClick={() => handleOptionClick(optionIndex)}
                disabled={isDisabled}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      </div>
      <div className="footer-actions row" style={{ justifyContent: 'space-between' }}>
        <Link className="btn" to={`/quiz/${quiz.id}`}>
          Quit
        </Link>
        <button id="nextBtn" className="btn primary" disabled={!canSubmit} onClick={() => handleSubmit()}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Play;

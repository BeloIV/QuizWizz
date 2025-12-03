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
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const initiallyWrongRef = useRef(new Set());
  const timeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

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
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, [quizId, quiz?.id]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
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

      // Show transient "Try again" toast for incorrect answer
      setShowTryAgain(true);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowTryAgain(false);
      }, 2000);
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
        <button type="button" className="btn" onClick={() => setShowQuitDialog(true)}>
          Quit
        </button>
      </div>
      {showTryAgain && (
        <div className="popup popup--danger popup--top" role="alert" aria-live="assertive">
          Try again
        </div>
      )}

      {showQuitDialog && (
        <div className="dialog-overlay" role="presentation" onClick={() => setShowQuitDialog(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="quit-title" className="dialog__title">Are you sure you want to quit?</h3>
            <p className="dialog__body">You will lose your answers.</p>
            <div className="dialog__actions">
              <button type="button" className="btn" onClick={() => setShowQuitDialog(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
                autoFocus
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Play;

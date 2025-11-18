import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';


/* --------------------------------------------------------
   Timer Display Component  
   - Formats remaining seconds into MM:SS  
   - Highlights when less than 60 seconds remain
---------------------------------------------------------*/
function TimerDisplay({ seconds }) {
  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(remainingSeconds).padStart(2, '0');

    return `${minStr}:${secStr}`;
  };

  return (
    <div className='sticky top-0 z-10'>
      <div className='bg-gray-800 text-white p-3 shadow-lg flex justify-between items-center px-6'>
        <span className='font-semibold text-gray-300'>Online Test Platform</span>
          <span className={`font-bold text-lg ${seconds < 60 ? 'text-red-400' : ''}`}>
            Time Left: {formatTime()}
          </span>
        </div>
      </div>
  );
}


/* --------------------------------------------------------
   Warning Banner  
   - Shown when user switches browser tabs
---------------------------------------------------------*/
function WarningBanner({ count, max }) {
  if (count === 0) return null;

  return (
    <div className='bg-red-100 border-1-4 border-red-500 text-red-700 p-4 mb-6 mx-auto max-w-3xl mt-4' role='alert'>
      <p className='font-bold'>Warning!</p>
      <p>Tab switching is prohibited, The test will auto-submit on the 3rd violation.</p>
    </div>
  );
}

/* --------------------------------------------------------
   Test Page Component  
   - Loads test
   - Displays questions
   - Handles timer, warnings, and submission
---------------------------------------------------------*/
function TestPage() {
  const { id } = useParams(); // Read the ':id' from the URL
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);

  // Stores student's answers: { questionId: "selectedOption" }
  const [answers, setAnswers] = useState({});

  // Tracks tab-switch warnings
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 3;

  // 1. Fetch the test questions when the page loads
  useEffect(() => {
    const fetchTest = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/tests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 404) throw new Error('Test not found');
        if (!response.ok) throw new Error('Failed to fetch test');

        const data = await response.json();
        setTest(data);

        // Once test loads, set the timer
        setTimeLeft(data.duration * 60)  // Convert minutes to seconds
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id, navigate]);

  // 2. Save answer when a radio button is selected
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value
    }));
  };


  // 3. Handle submission 
  // Wrapper to keep a stable callback for the timer effect
  const handleSubmit = useCallback(async () => {

    // Prevent double submission
    if (loading) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/tests/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answers })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit');

      // Success! Navigate to the results page
      alert('Test submitted successfully!');
      navigate(`/results/${data.submissionId}`);

    } catch (err) {
      setError(err.message);
      alert('Error submitting test: ' + err.message);
    }
  }, [id, answers, navigate, loading]); // Dependencies for usecallback

  
  // 4 Timer Countdown Effect 
  useEffect(() => {
    if (timeLeft === null) return;   // wait for timeLeft to be set (from fetch)
    if (timeLeft <= 0) return;   // If time is already 0, do nothing;

    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    // This is a "cleanup" function
    // React runs this when the component unmounts (to prevent memory leaks)
    return () => clearInterval(timerInterval);

  }, [timeLeft]);  //Runs only when timerLeft changes

  // 5 Auto-submit Effect
  useEffect(() => {
    if (timeLeft === 0) {
      alert("Times's up! Submitting your test...");
      handleSubmit();
    }
  }, [timeLeft, handleSubmit]); // Runs when timeLeft changes

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // The user just switched tabs or minimized window
        setWarnings(prev => {
          const newCount = prev + 1;

          if (newCount >= MAX_WARNINGS) {
            alert("Violation Limit Reached. Test Terminated");
            handleSubmit(); // Auto-submit
          } else {
            alert("Warning: Tab switch detected! After 3 switches, the test will auto-submit.");
          }

          return newCount;
        });
      }
    };

    // Attch the listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup the listener when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleSubmit]);  //Re-bind if handleSubmit changes

  if (loading) return <div className="text-center mt-10">Loading Test...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <>
      {/* Timer is now here, outside the main container */}
      {timeLeft !== null && <TimerDisplay seconds={timeLeft} />}

      {/* Show warning banner if user has warnigns */}
      <WarningBanner count={warnings} max={MAX_WARNINGS} />

      <div className="container mx-auto p-6 max-w-3xl">
        {/* Test Header */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold mb-2">{test?.title}</h1>
          <p className="text-gray-600 mb-4">{test?.description}</p>
        </div>

        {/* Questions Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-6">
            {test?.questions.map((q, index) => (
              <div key={q.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">
                  Question {index + 1}: {q.text}
                </h3>

                {/* Render options as radio buttons */}
                <div className="space-y-2">
                  {q.options.map((option, oIndex) => (
                    <label key={oIndex} className="flex items-center p-3 rounded-lg border border-gray-200 has-checked:bg-blue-50 has-checked:border-blue-400 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={() => handleAnswerChange(q.id, option)}
                        className="mr-3"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition"
            >
              Submit Test
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default TestPage;
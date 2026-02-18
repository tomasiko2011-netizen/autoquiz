'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BRANDS, type Brand } from '@/lib/data';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Volume2, VolumeX } from 'lucide-react';
import { useSounds } from '@/hooks/use-sounds';

type QuizItem = Brand & {
  logoUrl: string;
  logoHint: string;
};

type QuizStep = 'brand' | 'origin';

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function QuizFlow() {
  const router = useRouter();
  const { playSound, isSoundEnabled, toggleSound } = useSounds();
  const [playerName, setPlayerName] = useState('');
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState<QuizStep>('brand');
  const [score, setScore] = useState({ brands: 0, origins: 0 });
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const brandOptions = useMemo(() => BRANDS.map((b) => b.name), []);
  const originOptions = useMemo(() => Array.from(new Set(BRANDS.map((b) => b.origin))), []);

  useEffect(() => {
    const name = localStorage.getItem('autoQuizPlayerName');
    if (!name) {
      router.push('/');
      return;
    }
    setPlayerName(name);

    const allImagePlaceholders = new Map(
      PlaceHolderImages.map((p) => [p.id, p])
    );
    const combinedData: QuizItem[] = BRANDS.map((brand) => {
      const placeholder = allImagePlaceholders.get(brand.id);
      return {
        ...brand,
        logoUrl: placeholder?.imageUrl || '',
        logoHint: placeholder?.imageHint || '',
      };
    }).filter((item) => item.logoUrl);

    setQuizData(shuffleArray(combinedData).slice(0, 10)); // Limit to 10 questions for a quicker game
  }, [router]);

  const currentQuizItem = useMemo(() => quizData[currentQuestionIndex], [quizData, currentQuestionIndex]);

  const generateOptions = (correctAnswer: string, type: 'brand' | 'origin') => {
    if (!correctAnswer) return;
    const allAnswers = type === 'brand' ? brandOptions : originOptions;
    const wrongAnswers = shuffleArray(allAnswers.filter(a => a && a !== correctAnswer)).slice(0, 3);
    setOptions(shuffleArray([correctAnswer, ...wrongAnswers]));
  };

  useEffect(() => {
    if (quizData.length > 0 && currentQuizItem) {
      setOptions([]);
      if (step === 'brand') {
        generateOptions(currentQuizItem.name, 'brand');
      } else {
        generateOptions(currentQuizItem.origin, 'origin');
      }
    }
  }, [currentQuizItem, step, quizData.length]);


  if (quizData.length === 0 || !currentQuizItem) {
    return <div>Загрузка викторины...</div>;
  }
  
  const finishQuiz = () => {
    const results = {
      name: playerName,
      brands: score.brands,
      origins: score.origins,
      total: quizData.length,
      date: new Date().toISOString(),
    };
    
    const pastResults = JSON.parse(localStorage.getItem('autoQuizResults') || '[]');
    pastResults.unshift(results);
    localStorage.setItem('autoQuizResults', JSON.stringify(pastResults));

    const queryParams = new URLSearchParams({
      brands: String(score.brands),
      origins: String(score.origins),
      total: String(quizData.length)
    }).toString();

    // Проигрываем звук завершения
    playSound('completion');
    
    router.push(`/results?${queryParams}`);
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOption(null);

    if (step === 'brand') {
      setStep('origin');
    } else {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setStep('brand');
      } else {
        finishQuiz();
      }
    }
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;

    setIsAnswered(true);
    setSelectedOption(option);
    
    const correctAnswer = step === 'brand' ? currentQuizItem.name : currentQuizItem.origin;
    
    // Проигрываем звук в зависимости от правильности ответа
    if (option === correctAnswer) {
      playSound('correct');
      if (step === 'brand') {
        setScore(s => ({ ...s, brands: s.brands + 1 }));
      } else {
        setScore(s => ({ ...s, origins: s.origins + 1 }));
      }
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      handleNext();
    }, 1500);
  };
  
  const correctAnswer = step === 'brand' ? currentQuizItem.name : currentQuizItem.origin;

  const getButtonClass = (option: string) => {
    if (!isAnswered) return '';
    if (option === correctAnswer) return 'bg-green-500/80 hover:bg-green-500 text-white border-green-600';
    if (option === selectedOption) return 'bg-destructive/80 hover:bg-destructive text-destructive-foreground border-red-600';
    return 'opacity-50';
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-headline text-2xl">
            {step === 'brand' ? 'Чей это логотип?' : `Страна бренда: ${currentQuizItem.name}`}
          </CardTitle>
          <div className="text-lg font-bold">
            {currentQuestionIndex + 1} / {quizData.length}
          </div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / quizData.length) * 100} />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-8">
        {step === 'brand' && (
          <div className="relative w-full max-w-xs h-48 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={currentQuizItem.logoUrl}
              alt={`Логотип ${currentQuizItem.name}`}
              data-ai-hint={currentQuizItem.logoHint}
              fill
              unoptimized
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {options.map((option) => (
            <Button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered || !option}
              className={cn("h-16 text-lg justify-between px-6", getButtonClass(option))}
            >
              {option}
              {isAnswered && option === correctAnswer && <CheckCircle className="h-6 w-6" />}
              {isAnswered && option === selectedOption && option !== correctAnswer && <XCircle className="h-6 w-6" />}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            Счет: Бренды {score.brands}, Страны {score.origins}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSound}
            className="gap-2"
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Звук вкл</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span className="hidden sm:inline">Звук выкл</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

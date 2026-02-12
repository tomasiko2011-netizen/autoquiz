'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import { useSounds } from '@/hooks/use-sounds';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.1) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold text-lg"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

type Result = {
  name: string;
  countries: number;
  capitals: number;
  total: number;
  date: string;
};

export default function ResultsDisplay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { playSound } = useSounds();

  const [isClient, setIsClient] = useState(false);
  const [resultsHistory, setResultsHistory] = useState<Result[]>([]);

  useEffect(() => {
    setIsClient(true);
    const pastResults = JSON.parse(localStorage.getItem('geoWhizResults') || '[]');
    setResultsHistory(pastResults);
    
    // Проигрываем звук "Тадам" при загрузке результатов
    playSound('completion');
  }, [playSound]);

  const countriesScore = parseInt(searchParams.get('countries') || '0', 10);
  const capitalsScore = parseInt(searchParams.get('capitals') || '0', 10);
  const totalQuestions = parseInt(searchParams.get('total') || '0', 10);

  useEffect(() => {
    if (isClient && totalQuestions === 0) {
      router.replace('/');
    }
  }, [totalQuestions, router, isClient]);
  
  const leaderboard = useMemo(() => {
    return [...resultsHistory]
      .sort((a, b) => (b.countries + b.capitals) - (a.countries + a.capitals) || new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [resultsHistory]);

  if (!isClient || totalQuestions === 0) {
    return null; // or a loading skeleton
  }

  const totalPossibleScore = totalQuestions * 2;
  const totalCorrect = countriesScore + capitalsScore;
  const percentage =
    totalPossibleScore > 0
      ? ((totalCorrect / totalPossibleScore) * 100).toFixed(1)
      : '0.0';

  const data = [
    { name: 'Правильно', value: totalCorrect, color: 'hsl(var(--chart-1))' },
    { name: 'Неправильно', value: totalPossibleScore - totalCorrect, color: 'hsl(var(--chart-2))' },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">🎉 Тадам! Ваши результаты</CardTitle>
          <CardDescription className="text-lg">
            Отличная работа! Вот ваш счёт:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderRadius: 'var(--radius)',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="text-left space-y-2 text-lg">
            <p>
              <span className="font-bold">Правильных ответов (страны):</span>{' '}
              {countriesScore} из {totalQuestions}
            </p>
            <p>
              <span className="font-bold">Правильных ответов (столицы):</span>{' '}
              {capitalsScore} из {totalQuestions}
            </p>
            <p className="font-bold text-xl pt-2">
              <span className="font-headline">Общий процент:</span> {percentage}%
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild size="lg" className="font-headline text-lg">
            <Link href="/">Начать заново</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {leaderboard.length > 0 && (
        <Card className="w-full max-w-lg text-center shadow-2xl animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">🏆 ТОП-10 Результатов</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead className="text-right">Счет</TableHead>
                  <TableHead className="text-right">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((r, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="text-right">{r.countries + r.capitals} / {r.total * 2}</TableCell>
                    <TableCell className="text-right">{new Date(r.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

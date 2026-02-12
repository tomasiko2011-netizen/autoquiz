'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSounds } from '@/hooks/use-sounds';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { isSoundEnabled, toggleSound } = useSounds();

  const handleStart = () => {
    if (name.trim().length < 2) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пожалуйста, введите имя (минимум 2 символа).',
      });
      return;
    }
    localStorage.setItem('geoWhizPlayerName', name);
    router.push('/quiz');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-100/[0.05] dark:bg-grid-slate-700/[0.05]"></div>
      <Card className="w-full max-w-md text-center shadow-2xl z-10 animate-fade-in-up">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">
            GeoWhiz
          </CardTitle>
          <CardDescription className="text-lg pt-2">
            Изучайте страны, флаги и столицы мира в увлекательной викторине!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <p className="text-muted-foreground text-center">
            Проверьте свои знания и станьте экспертом в географии.
          </p>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              Введите ваше имя:
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Имя игрока"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleStart()}
              className="text-base"
            />
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSound}
              className="w-full gap-2"
            >
              {isSoundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  Звуки включены
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  Звуки выключены
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {isSoundEnabled ? 
                'При ответах будут звуки' : 
                'Звуки отключены'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleStart} size="lg" className="font-headline text-lg">
            Начать обучение
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck,
  Activity,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrimoPeriodoStats } from '@/lib/primo-periodo-stats';

interface PrimoPeriodoControlliDashboardProps {
  stats: PrimoPeriodoStats;
  reportLines: string[];
}

interface ControlloItem {
  titolo: string;
  descrizione: string;
  stato: 'ok' | 'warning' | 'info';
  valore?: string | number;
  dettaglio?: string;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendLabel,
  variant = 'default'
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: {
      bg: 'bg-card',
      border: 'border-border',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-foreground'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700 dark:text-green-400'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700 dark:text-amber-400'
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700 dark:text-red-400'
    }
  };

  const styles = variantStyles[variant];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <Card className={cn(styles.bg, styles.border)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", styles.iconBg)}>
              <Icon className={cn("h-6 w-6", styles.iconColor)} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={cn("text-2xl font-bold", styles.valueColor)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          {trend && trendLabel && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            )}>
              <TrendIcon className="h-3 w-3" />
              {trendLabel}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ControlloCard({ controllo }: { controllo: ControlloItem }) {
  const getStatusConfig = () => {
    switch (controllo.stato) {
      case 'ok':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600',
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'OK'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          label: 'Attenzione'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          label: 'Info'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border transition-all",
      config.bgColor, 
      config.borderColor
    )}>
      <div className={cn("p-2 rounded-lg", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{controllo.titolo}</p>
          <Badge className={cn("text-xs", config.badgeClass)}>{config.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{controllo.descrizione}</p>
        {controllo.dettaglio && (
          <p className="text-xs font-mono text-muted-foreground mt-1">{controllo.dettaglio}</p>
        )}
      </div>
      {controllo.valore !== undefined && (
        <div className="text-right">
          <p className="text-lg font-bold">{controllo.valore}</p>
        </div>
      )}
    </div>
  );
}

function DistribuzioneBar({ data }: { data: { categoria: string; count: number; percentuale: number; colore: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  return (
    <div className="space-y-3">
      <div className="flex h-8 rounded-lg overflow-hidden">
        {data.map((item, index) => (
          item.percentuale > 0 && (
            <div
              key={index}
              className="flex items-center justify-center text-xs font-medium text-white transition-all hover:opacity-80"
              style={{ 
                width: `${item.percentuale}%`, 
                backgroundColor: item.colore,
                minWidth: item.percentuale > 5 ? 'auto' : '0'
              }}
              title={`${item.categoria}: ${item.count} (${item.percentuale.toFixed(1)}%)`}
            >
              {item.percentuale > 8 && `${item.percentuale.toFixed(0)}%`}
            </div>
          )
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: item.colore }}
            />
            <span className="truncate">{item.categoria}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrimoPeriodoControlliDashboard({ stats, reportLines }: PrimoPeriodoControlliDashboardProps) {
  // Calcola controlli automatici basati sulle statistiche
  const controlli: ControlloItem[] = React.useMemo(() => {
    const result: ControlloItem[] = [];
    
    // Controllo 1: Dati caricati correttamente
    result.push({
      titolo: 'Dati Caricati',
      descrizione: `${stats.totaleRighe} righe elaborate correttamente`,
      stato: stats.totaleRighe > 0 ? 'ok' : 'warning',
      valore: stats.totaleRighe
    });
    
    // Controllo 2: Studenti identificati
    result.push({
      titolo: 'Studenti Identificati',
      descrizione: `${stats.totaleStudenti} studenti unici in ${stats.totaleClassi} classi`,
      stato: 'ok',
      valore: stats.totaleStudenti
    });
    
    // Controllo 3: Materie elaborate
    result.push({
      titolo: 'Materie Elaborate',
      descrizione: `${stats.totaleMaterie} materie didattiche analizzate`,
      stato: 'ok',
      valore: stats.totaleMaterie
    });
    
    // Controllo 4: Percentuale insufficienze
    const percInsuff = stats.percentualeInsuffTotale;
    result.push({
      titolo: 'Tasso Insufficienze',
      descrizione: percInsuff > 30 ? 'Percentuale elevata di insufficienze' : 'Percentuale nella norma',
      stato: percInsuff > 30 ? 'warning' : percInsuff > 20 ? 'info' : 'ok',
      valore: `${percInsuff.toFixed(1)}%`
    });
    
    // Controllo 5: Studenti con 4+ insufficienze
    const studentiCritici = stats.distribuzioneScuola.find(d => d.categoria === '4+ insufficienze')?.count || 0;
    const percCritici = stats.totaleStudenti > 0 ? (studentiCritici / stats.totaleStudenti) * 100 : 0;
    result.push({
      titolo: 'Studenti Critici',
      descrizione: `Studenti con 4 o più insufficienze`,
      stato: percCritici > 15 ? 'warning' : percCritici > 10 ? 'info' : 'ok',
      valore: studentiCritici,
      dettaglio: `${percCritici.toFixed(1)}% del totale`
    });
    
    // Controllo 6: Media voti
    result.push({
      titolo: 'Media Voti Orali',
      descrizione: stats.mediaVotiOrali >= 6 ? 'Media sufficiente' : 'Media insufficiente',
      stato: stats.mediaVotiOrali >= 6 ? 'ok' : 'warning',
      valore: stats.mediaVotiOrali.toFixed(2)
    });
    
    return result;
  }, [stats]);

  // Calcola studenti senza insufficienze
  const studentiSenzaInsuff = stats.distribuzioneScuola.find(d => d.categoria === 'Nessuna insuff.')?.count || 0;
  const percentualeSenzaInsuff = stats.totaleStudenti > 0 
    ? (studentiSenzaInsuff / stats.totaleStudenti) * 100 
    : 0;

  // Calcola studenti con 4+ insufficienze
  const studentiCon4PiuInsuff = stats.distribuzioneScuola.find(d => d.categoria === '4+ insufficienze')?.count || 0;
  const percentualeCon4PiuInsuff = stats.totaleStudenti > 0 
    ? (studentiCon4PiuInsuff / stats.totaleStudenti) * 100 
    : 0;

  const okCount = controlli.filter(c => c.stato === 'ok').length;
  const warningCount = controlli.filter(c => c.stato === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard Controlli Primo Periodo</h2>
            <p className="text-sm text-muted-foreground">
              Analisi automatica dei dati del primo periodo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {okCount} OK
          </Badge>
          {warningCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warningCount} Attenzione
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Studenti Totali"
          value={stats.totaleStudenti}
          subtitle={`in ${stats.totaleClassi} classi`}
          icon={Users}
        />
        <StatCard
          title="Materie Analizzate"
          value={stats.totaleMaterie}
          subtitle="materie didattiche"
          icon={BookOpen}
        />
        <StatCard
          title="Senza Insufficienze"
          value={`${percentualeSenzaInsuff.toFixed(1)}%`}
          subtitle={`${studentiSenzaInsuff} studenti`}
          icon={Award}
          variant="success"
          trend="up"
          trendLabel="Positivo"
        />
        <StatCard
          title="Situazione Critica"
          value={`${percentualeCon4PiuInsuff.toFixed(1)}%`}
          subtitle={`${studentiCon4PiuInsuff} studenti con 4+ insuff.`}
          icon={AlertCircle}
          variant={percentualeCon4PiuInsuff > 15 ? 'danger' : percentualeCon4PiuInsuff > 10 ? 'warning' : 'default'}
          trend={percentualeCon4PiuInsuff > 15 ? 'down' : undefined}
          trendLabel={percentualeCon4PiuInsuff > 15 ? 'Critico' : undefined}
        />
      </div>

      {/* Distribuzione Insufficienze */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuzione Studenti per Numero di Insufficienze
          </CardTitle>
          <CardDescription>
            Panoramica della distribuzione degli studenti in base al numero di materie insufficienti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DistribuzioneBar data={stats.distribuzioneScuola} />
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.distribuzioneScuola.map((item, index) => (
              <div 
                key={index}
                className="text-center p-3 rounded-lg border"
                style={{ borderLeftColor: item.colore, borderLeftWidth: 4 }}
              >
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.categoria}</p>
                <p className="text-xs font-medium" style={{ color: item.colore }}>
                  {item.percentuale.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controlli di Coerenza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Controlli Automatici
          </CardTitle>
          <CardDescription>
            Verifiche automatiche sulla qualità e completezza dei dati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {controlli.map((controllo, index) => (
              <ControlloCard key={index} controllo={controllo} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Materie Critiche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Materie con Maggiori Difficoltà
          </CardTitle>
          <CardDescription>
            Le 5 materie con la percentuale più alta di insufficienze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.insufficienzePerMateria.slice(0, 5).map((materia, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <span className="font-medium">{materia.materia}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">
                      {materia.percentualeInsuff.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({materia.insufficienze}/{materia.totaleVoti})
                    </span>
                  </div>
                </div>
                <Progress 
                  value={materia.percentualeInsuff} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
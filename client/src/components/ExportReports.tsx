import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, BarChart3, Calendar, Users, Brain, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportReportsProps {
  patientId?: string;
  timeRange?: string;
  userRole?: string;
}

export default function ExportReports({ patientId, timeRange, userRole }: ExportReportsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'overview', 'progress', 'insights', 'predictions'
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const reportSections = [
    {
      id: 'overview',
      name: 'Analytics Overview',
      description: 'Summary statistics and key metrics',
      icon: BarChart3,
      size: '2-3 pages'
    },
    {
      id: 'progress',
      name: 'Progress Trajectory',
      description: '3D visualization and trend analysis',
      icon: TrendingUp,
      size: '4-5 pages'
    },
    {
      id: 'emotions',
      name: 'Emotion Heatmaps',
      description: 'Real-time emotion tracking and patterns',
      icon: Brain,
      size: '3-4 pages'
    },
    {
      id: 'breakthroughs',
      name: 'Breakthrough Timeline',
      description: 'Key therapeutic moments and milestones',
      icon: Target,
      size: '2-3 pages'
    },
    {
      id: 'neural',
      name: 'Neural Patterns',
      description: 'Brain activity visualization and analysis',
      icon: Brain,
      size: '3-4 pages'
    },
    {
      id: 'predictions',
      name: 'Predictive Analytics',
      description: 'AI-powered forecasts and recommendations',
      icon: TrendingUp,
      size: '4-6 pages'
    },
    {
      id: 'insights',
      name: 'AI Insights',
      description: 'Machine learning insights and recommendations',
      icon: Brain,
      size: '2-3 pages'
    },
    {
      id: 'risk',
      name: 'Risk Assessment',
      description: 'Risk factors and mitigation strategies',
      icon: Target,
      size: '2-3 pages'
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const intervals = [15, 35, 55, 75, 90, 100];
      const messages = [
        'Gathering analytics data...',
        'Processing visualizations...',
        'Generating insights...',
        'Creating report structure...',
        'Finalizing export...',
        'Complete!'
      ];

      for (let i = 0; i < intervals.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportProgress(intervals[i]);
        
        if (i < messages.length - 1) {
          toast({
            title: "Export Progress",
            description: messages[i],
            duration: 1000
          });
        }
      }

      // Generate download (in real app, this would be an API call)
      const filename = `EMDR_Analytics_Report_${patientId}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      
      toast({
        title: "Export Complete!",
        description: `Report "${filename}" is ready for download`,
        duration: 5000
      });

      // In real implementation, trigger actual download here
      // window.open(`/api/reports/download/${reportId}`, '_blank');

      setIsOpen(false);
      setExportProgress(0);
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const estimatedPages = selectedSections.reduce((total, sectionId) => {
    const section = reportSections.find(s => s.id === sectionId);
    const pages = section?.size?.split('-')[1] || '3';
    return total + parseInt(pages);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-export-reports">
          <Download className="w-4 h-4 mr-2" />
          Export Reports
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-export-reports">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Export Analytics Report
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive analytics reports with visualizations and insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Configuration</CardTitle>
              <CardDescription>
                Configure the format and content of your analytics report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger data-testid="select-export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="docx">Word Document</SelectItem>
                      <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select defaultValue="comprehensive">
                    <SelectTrigger data-testid="select-report-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                      <SelectItem value="summary">Executive Summary</SelectItem>
                      <SelectItem value="technical">Technical Analysis</SelectItem>
                      <SelectItem value="progress">Progress Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">Estimated Report Size</div>
                  <div className="text-sm text-muted-foreground">
                    ~{estimatedPages} pages • {selectedSections.length} sections
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {timeRange || '30 days'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Sections</CardTitle>
              <CardDescription>
                Select which analytics sections to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportSections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <div
                      key={section.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover-elevate"
                    >
                      <Checkbox
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => handleSectionToggle(section.id)}
                        data-testid={`checkbox-section-${section.id}`}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <label 
                            htmlFor={section.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {section.name}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {section.size}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Pro Tip
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Including all sections provides the most comprehensive analysis for clinical review and research purposes.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generating Report...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={exportProgress} className="w-full" />
                  <div className="text-sm text-muted-foreground text-center">
                    {exportProgress}% complete
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedSections.length === 0 ? (
                "Please select at least one section to export"
              ) : (
                `${selectedSections.length} sections selected • ~${estimatedPages} pages`
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                data-testid="button-cancel-export"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={selectedSections.length === 0 || isExporting}
                data-testid="button-generate-report"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
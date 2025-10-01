import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, StickyNote, PlusCircle, RefreshCw, Calendar, Tag } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// Placeholder types - replace with actual API types
interface Note {
  id: number;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  author: string;
  is_pinned: boolean;
}

interface NotesResponse {
  notes: Note[];
  total: number;
}

export function NotePage() {
  const { t } = useTranslation('note');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes from API
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when note API is implemented
      // const response = await listNotes();
      // setNotes(response.notes);

      // Mock data for now
      const mockNotes: Note[] = [
        {
          id: 1,
          title: 'Project Meeting Notes',
          content: 'Discussed the timeline for the upcoming website redesign project. Key points: - Budget approved for $50k - Launch target: end of Q2 - Team assignments finalized - Weekly check-ins scheduled for Fridays',
          tags: ['meeting', 'project', 'budget'],
          category: 'Work',
          created_at: '2024-05-10',
          updated_at: '2024-05-10',
          author: 'John Doe',
          is_pinned: true
        },
        {
          id: 2,
          title: 'API Documentation Ideas',
          content: 'Ideas for improving our API documentation: 1. Add more interactive examples 2. Include common use cases 3. Better error handling examples 4. Video tutorials for complex endpoints',
          tags: ['documentation', 'api', 'improvement'],
          category: 'Development',
          created_at: '2024-05-08',
          updated_at: '2024-05-09',
          author: 'Jane Smith',
          is_pinned: false
        },
        {
          id: 3,
          title: 'Team Building Activity Ideas',
          content: 'Brainstorming session for Q2 team building: - Escape room challenge - Cooking class - Outdoor hiking trip - Virtual game tournament - Volunteer work at local charity',
          tags: ['team-building', 'activities', 'planning'],
          category: 'HR',
          created_at: '2024-05-05',
          updated_at: '2024-05-05',
          author: 'Mike Johnson',
          is_pinned: false
        },
        {
          id: 4,
          title: 'Marketing Campaign Insights',
          content: 'Analysis of our last marketing campaign: - 23% increase in website traffic - 15% improvement in conversion rate - Social media engagement up 45% - ROI: 3.2x investment - Next steps: expand to LinkedIn ads',
          tags: ['marketing', 'analysis', 'roi'],
          category: 'Marketing',
          created_at: '2024-05-03',
          updated_at: '2024-05-07',
          author: 'Sarah Wilson',
          is_pinned: true
        }
      ];

      setNotes(mockNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800';

    const colors: Record<string, string> = {
      'Work': 'bg-blue-100 text-blue-800',
      'Development': 'bg-green-100 text-green-800',
      'HR': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Personal': 'bg-yellow-100 text-yellow-800',
    };

    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Sort notes by pinned status and then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Notes</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotes}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8">
          <StickyNote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No notes found</p>
          <Button variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNotes.map(note => (
            <Card key={note.id} className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${note.is_pinned ? 'ring-2 ring-yellow-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="hover:text-primary transition-colors line-clamp-2 text-base">
                    {note.is_pinned && '📌 '}{note.title}
                  </CardTitle>
                  {note.category && (
                    <Badge className={getCategoryColor(note.category)} variant="secondary">
                      {note.category}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {truncateContent(note.content)}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>By {note.author}</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  Read More
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* TODO: Add pagination when API supports it */}
      {notes.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {notes.length} notes • {notes.filter(n => n.is_pinned).length} pinned
          </p>
        </div>
      )}
    </div>
  );
}
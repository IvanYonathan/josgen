import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Event } from '@/types/event/event';
import { formatDate } from '@/utils/date';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(event)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="hover:text-primary transition-colors line-clamp-2 flex-1">
            {event.title}
          </CardTitle>
          <Badge className={getStatusColor(event.status)}>
            {event.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {event.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Start:</span>
              <span>{formatDate(event.start_date, { format: 'MMM DD, YYYY hh:mm A' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">End:</span>
              <span>{formatDate(event.end_date, { format: 'MMM DD, YYYY hh:mm A' })}</span>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{event.participants_count || 0} participants</span>
          </div>

          {event.divisions && event.divisions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.divisions.map((division) => (
                <Badge key={division.id} variant="outline" className="text-xs">
                  {division.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onClick(event);
          }}
        >
          {event.can_edit ? 'Edit Event' : 'View Details'}
        </Button>
      </CardFooter>
    </Card>
  );
}

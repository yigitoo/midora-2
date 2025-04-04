import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ForumTopicPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  
  const topicId = Number(id);
  
  const { data: topic, isLoading: isLoadingTopic } = useQuery({
    queryKey: [`/api/forum/topics/${topicId}`],
    enabled: !!topicId,
  });
  
  const { data: replies, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['/api/forum/replies', { topicId }],
    enabled: !!topicId,
  });
  
  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/forum/replies", {
        topicId,
        content
      });
      return await res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/forum/replies', { topicId }] });
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmitReply = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to reply",
        variant: "destructive"
      });
      return;
    }
    
    if (!replyContent.trim()) {
      toast({
        title: "Empty reply",
        description: "Please enter some content for your reply",
        variant: "destructive"
      });
      return;
    }
    
    replyMutation.mutate(replyContent);
  };
  
  if (isLoadingTopic || isLoadingReplies) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">Topic not found</p>
        <Link href="/forum">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Forums
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href={`/forum/category/${topic.categoryId}`}>
          <Button variant="ghost" className="mb-4 pl-0 hover:pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <Clock className="h-4 w-4 mr-1" />
          <span>Posted on {new Date(topic.createdAt).toLocaleString()}</span>
          <span className="mx-2">•</span>
          <span>Views: {topic.views}</span>
          {topic.isLocked && (
            <>
              <span className="mx-2">•</span>
              <span className="text-destructive">Locked</span>
            </>
          )}
        </div>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={topic.userAvatar} />
                <AvatarFallback>{topic.username?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {topic.username || 'Anonymous'}
                </div>
                <div className="whitespace-pre-wrap mt-2">{topic.content}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-bold mt-8 mb-4">Replies ({replies?.length || 0})</h2>
        <Separator className="mb-4" />
        
        {replies && replies.length > 0 ? (
          <div className="space-y-4 mb-8">
            {replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={reply.userAvatar} />
                      <AvatarFallback>{reply.username?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="font-medium">
                          {reply.username || 'Anonymous'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleString()}
                          {reply.isEdited && (
                            <span className="ml-2 text-xs">(Edited)</span>
                          )}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap mt-2">{reply.content}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6 mb-8">
            <CardContent>
              <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
            </CardContent>
          </Card>
        )}
        
        {!topic.isLocked && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Post a Reply</h3>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                className="min-h-[120px] mb-2"
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReplyContent("")}
                disabled={replyMutation.isPending || !replyContent.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReply}
                disabled={replyMutation.isPending || !replyContent.trim()}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Post Reply
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
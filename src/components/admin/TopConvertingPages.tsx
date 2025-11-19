import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TopConvertingPages({ clicksBySource }: { clicksBySource: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clicks by Traffic Source</CardTitle>
        <CardDescription>Which traffic sources drive Amazon clicks</CardDescription>
      </CardHeader>
      <CardContent>
        {clicksBySource.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clicksBySource.slice(0, 10).map((source, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{source.source}</TableCell>
                  <TableCell className="text-right">{source.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

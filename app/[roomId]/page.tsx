import Page from '../page';

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;
    return <Page params={{ roomId }} />;
}

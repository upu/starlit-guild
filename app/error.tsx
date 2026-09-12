'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){
 return <main className="recovery-screen"><h1>冒険の画面を開けませんでした</h1><p>セーブデータは消去していません。もう一度読み込んで、冒険を再開してください。</p><button onClick={reset}>もう一度試す</button><button className="outline" onClick={()=> { window.location.reload(); }}>ページを読み直す</button></main>;
}

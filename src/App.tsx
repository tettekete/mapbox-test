import { useEffect, useState } from "react";
import MiniMap from "./components/MiniMap";
import TsunamiHazardMap from "./components/TsunamiHazardMap";
import MultiLayerMap from "./components/MultiLayerMap";

type View = "mini" | "tsunami" | "multi";

export default function App()
{
	// 初期値は URL ハッシュ（なければ mini）
	const init = (): View =>
	{
		const h = (location.hash.replace(/^#/, "") || "mini") as View;
		if( h === "mini" || h === "tsunami" || h === "multi" ) return h;
		return "mini";
	};

	const [view, setView] = useState<View>(init);

	// ハッシュ変更 → view へ反映
	useEffect(() =>
	{
		function onHashChange()
		{
			const h = (location.hash.replace(/^#/, "") || "mini") as View;
			if( h === "mini" || h === "tsunami" || h === "multi" )
			{
				setView(h);
			}
		}
		window.addEventListener("hashchange", onHashChange);
		return () => window.removeEventListener("hashchange", onHashChange);
	}, []);

	// view 変更 → ハッシュへ反映（直リンク可能に）
	useEffect(() =>
	{
		const next = `#${view}`;
		if( location.hash !== next )
		{
			location.hash = next;
		}
	}, [view]);

	function NavButton(props: { id: View; label: string })
	{
		const active = view === props.id;
		return (
			<button
				type="button"
				onClick={() => setView(props.id)}
				className={
					"px-3 py-1.5 rounded-md text-sm font-medium " +
					(active
						? "bg-blue-600 text-white shadow"
						: "bg-white text-gray-700 hover:bg-gray-100 border")
				}
			>
				{props.label}
			</button>
		);
	}

	return (
		<div className="flex flex-col h-screen min-h-0">
			{/* ナビゲーションバー（上部固定） */}
			<header className="shrink-0 border-b bg-white">
				<div className="mx-auto max-w-screen-xl px-3 py-2 flex items-center gap-2">
					<span className="text-sm text-gray-500 mr-2">View:</span>
					<nav className="flex gap-2">
						<NavButton id="mini" label="MiniMap" />
						<NavButton id="tsunami" label="TsunamiHazardMap" />
						<NavButton id="multi" label="MultiLayerMap" />
					</nav>
				</div>
			</header>

			{/* ビュー領域（ヘッダーを除く残り全体） */}
			<main className="flex-1 min-h-0">
				<div className="relative w-full h-full">
					{view === "mini" && <MiniMap />}
					{view === "tsunami" && <TsunamiHazardMap />}
					{view === "multi" && <MultiLayerMap />}
				</div>
			</main>
		</div>
	);
}
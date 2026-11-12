from flask import Flask, render_template, request, jsonify
import database

app = Flask(__name__)

# 起動時にデータベースを初期化
database.init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/ranking", methods=["GET"])
def get_ranking():
    limit = request.args.get("limit", default=10, type=int)
    scores = database.get_top_scores(limit=min(limit, 50))
    return jsonify({"success": True, "ranking": scores})

@app.route("/api/score", methods=["POST"])
def submit_score():
    data = request.get_json() or {}
    player_name = str(data.get("name", "")).strip()[:15] or "名無しの旅人"
    
    try:
        score = int(data.get("score", 0))
        survival_time = float(data.get("survival_time", 0.0))
        stars_collected = int(data.get("stars", 0))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid data format"}), 400

    new_id = database.save_score(
        player_name=player_name,
        score=score,
        survival_time=round(survival_time, 1),
        stars_collected=stars_collected
    )

    ranking = database.get_top_scores(limit=10)
    # 登録されたスコアの順位を判定
    user_rank = None
    for idx, item in enumerate(ranking, start=1):
        if item["id"] == new_id:
            user_rank = idx
            break

    return jsonify({
        "success": True,
        "id": new_id,
        "rank": user_rank,
        "ranking": ranking
    })

@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = database.get_stats()
    return jsonify({"success": True, "stats": stats})

if __name__ == "__main__":
    print("=" * 50)
    print("🌅 Sunset Fall - サーバー起動中...")
    print("ブラウザで http://127.0.0.1:5000 を開いてください")
    print("=" * 50)
    app.run(host="127.0.0.1", port=5000, debug=True)

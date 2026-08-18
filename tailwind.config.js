/** @type {import('tailwindcss').Config} */
// Tailwind 主题配置：定义"我们的光年"专属配色与圆润字体
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        love: {
          DEFAULT: '#FF6B81', // 主色：珊瑚粉
          deep: '#F04E68', // 深一点的粉，用于文字强调
          light: '#F5A0B0', // 点缀色
          bg: '#FFF5F7', // 辅色：淡粉背景
        },
      },
      fontFamily: {
        // 圆润柔和字体：标题用站酷快乐体，数字用 Nunito，离线回退系统字体
        rounded: [
          '"ZCOOL KuaiLe"',
          '"Nunito"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(255, 107, 129, 0.15)',
        card: '0 4px 20px rgba(255, 107, 129, 0.12)',
      },
    },
  },
  plugins: [],
}

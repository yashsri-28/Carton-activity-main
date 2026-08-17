function Dropdown({ row }) {
  const ref = useRef(null);
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 200) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`absolute right-0 w-44 bg-[#E5E7EB] rounded-2xl shadow-xl z-50 border border-gray-200
        ${openUpward ? "bottom-full mb-2" : "top-full mt-2"}
      `}
    >
      {/* actions here */}
    </div>
  );
}

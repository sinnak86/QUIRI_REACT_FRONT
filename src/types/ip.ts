export interface IpEntry {
  id: string;
  name: string;      // 접근명
  ip: string;        // 접근 IP (단일 IP, 와일드카드 192.168.1.*, CIDR 192.168.1.0/24 지원)
  note: string;      // 비고
  createdAt: string; // ISO 날짜 문자열
}
